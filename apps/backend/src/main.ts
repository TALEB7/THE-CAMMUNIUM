import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('The Communium API')
    .setDescription('API documentation for The Communium platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & user management')
    .addTag('profiles', 'User profiles management')
    .addTag('payments', 'Payments & subscriptions')
    .addTag('tokens', 'Tks token system')
    .addTag('categories', 'Marketplace categories')
    .addTag('marketplace', 'Marketplace listings')
    .addTag('auctions', 'Auction system')
    .addTag('messaging', 'Real-time messaging')
    .addTag('notifications', 'Notification system')
    .addTag('mentorship', 'Mentorship platform')
    .addTag('admin', 'Administration')
    .addTag('analytics', 'Analytics & tracking')
    .addTag('reports', 'Report system')
    .addTag('search', 'Advanced search & saved searches')
    .addTag('recommendations', 'Recommendation engine')
    .addTag('company-creation', 'Company creation wizard')
    .addTag('documents', 'Document management & verification')
    .addTag('comparisons', 'Listing comparison tool')
    .addTag('forums', 'Discussion forums')
    .addTag('events', 'Events & meetups')
    .addTag('groups', 'Groups & communities')
    .addTag('connections', 'User connections & networking')
    .addTag('activity-feed', 'Activity feed & timeline')
    .addTag('badges', 'Badges & gamification')
    .addTag('polls', 'Polls & voting')
    .addTag('bookmarks', 'Bookmarks & favorites')
    .addTag('announcements', 'Platform announcements')
    .addTag('faq', 'FAQ & help center')
    .addTag('testimonials', 'User testimonials')
    .addTag('newsletter', 'Newsletter & contact')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 The Communium API is running on http://localhost:${port}/api`);
  console.log(`📄 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap().catch(err => {
  console.error('FATAL NEST BOOT ERROR:', err);
  process.exit(1);
});
