import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';
import { UploadsModule } from './uploads/uploads.module';

// Core
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PaymentsModule } from './payments/payments.module';
import { TokensModule } from './tokens/tokens.module';

// Infrastructure
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { CompanyCreationModule } from './company-creation/company-creation.module';
import { DocumentsModule } from './documents/documents.module';

// Domain aggregates
import { CommerceModule } from './commerce/commerce.module';
import { CommunityModule } from './community/community.module';
import { ContentModule } from './content/content.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,

    // Core
    AuthModule,
    ProfilesModule,
    PaymentsModule,
    TokensModule,

    // Commerce (categories, marketplace, auctions, comparisons)
    CommerceModule,

    // Community (forums, events, groups, connections, activity-feed, mentorship, meetings)
    CommunityModule,

    // Content (badges, polls, bookmarks, announcements, faq, testimonials, newsletter)
    ContentModule,

    // Infrastructure
    MessagingModule,
    NotificationsModule,
    AdminModule,
    AnalyticsModule,
    ReportsModule,
    SearchModule,
    RecommendationsModule,
    CompanyCreationModule,
    DocumentsModule,

    // Uploads
    UploadsModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/api/uploads',
      serveStaticOptions: { index: false },
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
