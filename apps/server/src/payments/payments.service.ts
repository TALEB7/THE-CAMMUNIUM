import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

// Plan pricing in MAD (Dirhams)
const PLAN_PRICES: Record<string, { amount: number; name: string; interval: 'year' | 'one_time' }> = {
  personal_premium: { amount: 200, name: 'Personnel Premium', interval: 'year' },
  business_premium: { amount: 500, name: 'Business Premium', interval: 'year' },
  company_creation: { amount: 3000, name: 'Création Entreprise', interval: 'one_time' },
};

const VAT_RATE = 0.20; // 20% TVA Morocco

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Get current membership for user
   */
  async getMembership(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { membership: true },
    });

    if (!user) throw new NotFoundException('User not found');

    if (!user.membership) {
      return { plan: null, status: 'none', message: 'Aucun abonnement actif' };
    }

    return {
      planId: user.membership.plan,
      planName: PLAN_PRICES[user.membership.plan]?.name || user.membership.plan,
      status: user.membership.status,
      expiresAt: user.membership.expiresAt,
      createdAt: user.membership.createdAt,
    };
  }

  /**
   * Create a subscription — returns checkout URL
   */
  async createSubscription(clerkId: string, dto: CreateSubscriptionDto) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');

    const plan = PLAN_PRICES[dto.planId];
    if (!plan) throw new BadRequestException('Invalid plan');

    const amountTTC = Math.round(plan.amount * (1 + VAT_RATE)); // Amount with VAT
    const amountHT = plan.amount;
    const vatAmount = amountTTC - amountHT;

    if (dto.paymentMethod === 'stripe') {
      return this.createStripeCheckout(user.id, user.email, dto.planId, plan, amountTTC);
    } else if (dto.paymentMethod === 'cmi') {
      return this.createCmiPayment(user.id, dto.planId, plan, amountTTC);
    }

    throw new BadRequestException('Invalid payment method');
  }

  /**
   * Create Stripe Checkout Session
   */
  private async createStripeCheckout(
    userId: string,
    email: string,
    planId: string,
    plan: (typeof PLAN_PRICES)[string],
    amountTTC: number,
  ) {
    const frontendUrl = this.config.get<string>('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000';

    // Convert MAD to cents (Stripe uses smallest currency unit)
    const amountInCents = amountTTC * 100;

    const session = await this.stripe.checkout.sessions.create({
      mode: plan.interval === 'year' ? 'subscription' : 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'mad',
            product_data: {
              name: plan.name,
              description: `The Communium - ${plan.name}`,
            },
            unit_amount: amountInCents,
            ...(plan.interval === 'year' && {
              recurring: { interval: 'year' },
            }),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId,
      },
      success_url: `${frontendUrl}/membership?success=true`,
      cancel_url: `${frontendUrl}/membership?canceled=true`,
    });

    // Record pending payment
    await this.prisma.payment.create({
      data: {
        userId,
        amount: amountTTC,
        currency: 'MAD',
        provider: 'STRIPE',
        providerRef: session.id,
        status: 'PENDING',
        planId,
        vatAmount: amountTTC - Math.round(amountTTC / (1 + VAT_RATE)),
      },
    });

    return { checkoutUrl: session.url };
  }

  /**
   * Create CMI payment redirect
   */
  private async createCmiPayment(
    userId: string,
    planId: string,
    plan: (typeof PLAN_PRICES)[string],
    amountTTC: number,
  ) {
    // CMI integration placeholder
    // In production, generate a signed form POST to CMI gateway
    const callbackUrl = this.config.get<string>('CMI_CALLBACK_URL');
    const merchantId = this.config.get<string>('CMI_MERCHANT_ID');

    // Record pending payment
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: amountTTC,
        currency: 'MAD',
        provider: 'CMI',
        providerRef: `cmi_${Date.now()}`,
        status: 'PENDING',
        planId,
        vatAmount: amountTTC - Math.round(amountTTC / (1 + VAT_RATE)),
      },
    });

    // TODO: Replace with actual CMI gateway URL and signed parameters
    return {
      checkoutUrl: '/membership?payment=cmi_pending',
      paymentId: payment.id,
      message: 'CMI payment integration - configure in production',
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody.toString(), signature, webhookSecret!);
    } catch (err) {
      this.logger.error('Stripe webhook signature verification failed');
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleSuccessfulPayment(session);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionCanceled(subscription);
        break;
      }
    }

    return { received: true };
  }

  /**
   * Handle successful payment — activate membership
   */
  private async handleSuccessfulPayment(session: Stripe.Checkout.Session) {
    const { userId, planId } = session.metadata!;

    // Update payment status
    await this.prisma.payment.updateMany({
      where: { providerRef: session.id },
      data: { status: 'COMPLETED' },
    });

    // Calculate expiry
    const plan = PLAN_PRICES[planId!];
    const expiresAt = plan.interval === 'year'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : null;

    // Upsert membership
    await this.prisma.membership.upsert({
      where: { userId: userId! },
      update: {
        plan: planId!,
        status: 'ACTIVE',
        expiresAt,
      },
      create: {
        userId: userId!,
        plan: planId!,
        status: 'ACTIVE',
        expiresAt,
      },
    });

    // Update user verification
    await this.prisma.user.update({
      where: { id: userId! },
      data: { isVerified: true },
    });

    this.logger.log(`Membership activated for user ${userId}: ${planId}`);
  }

  /**
   * Handle subscription cancellation
   */
  private async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    // Find the payment/user associated with this subscription
    this.logger.log(`Subscription canceled: ${subscription.id}`);
  }

  /**
   * Handle CMI callback
   */
  async handleCmiCallback(body: any) {
    // TODO: Verify CMI signature and process payment
    this.logger.log('CMI callback received', body);
    return { received: true };
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(clerkId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');

    const payments = await this.prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p: any) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      provider: p.provider,
      status: p.status,
      planId: p.planId,
      planName: PLAN_PRICES[p.planId || '']?.name || p.planId,
      vatAmount: p.vatAmount,
      createdAt: p.createdAt,
    }));
  }
}
