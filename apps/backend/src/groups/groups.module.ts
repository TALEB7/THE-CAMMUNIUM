import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { FeedGateway } from './feed.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [GroupsController],
  providers: [GroupsService, FeedGateway],
  exports: [GroupsService],
})
export class GroupsModule {}
