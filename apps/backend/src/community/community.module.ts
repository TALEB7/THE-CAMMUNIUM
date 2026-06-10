import { Module } from '@nestjs/common';
import { ForumsModule } from '../forums/forums.module';
import { EventsModule } from '../events/events.module';
import { GroupsModule } from '../groups/groups.module';
import { ConnectionsModule } from '../connections/connections.module';
import { ActivityFeedModule } from '../activity-feed/activity-feed.module';
import { MentorshipModule } from '../mentorship/mentorship.module';
import { MeetingsModule } from '../meetings/meetings.module';

@Module({
  imports: [
    ForumsModule,
    EventsModule,
    GroupsModule,
    ConnectionsModule,
    ActivityFeedModule,
    MentorshipModule,
    MeetingsModule,
  ],
  exports: [
    ForumsModule,
    EventsModule,
    GroupsModule,
    ConnectionsModule,
    ActivityFeedModule,
    MentorshipModule,
    MeetingsModule,
  ],
})
export class CommunityModule {}
