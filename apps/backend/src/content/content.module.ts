import { Module } from '@nestjs/common';
import { BadgesModule } from '../badges/badges.module';
import { PollsModule } from '../polls/polls.module';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { FaqModule } from '../faq/faq.module';
import { TestimonialsModule } from '../testimonials/testimonials.module';
import { NewsletterModule } from '../newsletter/newsletter.module';

@Module({
  imports: [
    BadgesModule,
    PollsModule,
    BookmarksModule,
    AnnouncementsModule,
    FaqModule,
    TestimonialsModule,
    NewsletterModule,
  ],
  exports: [
    BadgesModule,
    PollsModule,
    BookmarksModule,
    AnnouncementsModule,
    FaqModule,
    TestimonialsModule,
    NewsletterModule,
  ],
})
export class ContentModule {}
