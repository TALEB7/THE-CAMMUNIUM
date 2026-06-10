import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Get current user's membership status
   */
  @Get('membership')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current membership' })
  async getMembership(@CurrentUser('id') userId: string) {
    return this.paymentsService.getMembership(userId);
  }

  /**
   * Subscribe to a plan — creates Stripe checkout session or CMI redirect
   */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a plan' })
  async subscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.paymentsService.createSubscription(userId, dto);
  }

  /**
   * Stripe webhook — handle successful payments
   */
  @Post('webhook/stripe')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleStripeWebhook(req.rawBody!, signature);
  }

  /**
   * CMI callback — handle CMI payment result
   */
  @Post('cmi/callback')
  @HttpCode(200)
  @ApiOperation({ summary: 'CMI payment callback' })
  async handleCmiCallback(@Body() body: any) {
    return this.paymentsService.handleCmiCallback(body);
  }

  /**
   * Get payment history
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history' })
  async getPaymentHistory(@CurrentUser('id') userId: string) {
    return this.paymentsService.getPaymentHistory(userId);
  }
}
