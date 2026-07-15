import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ForumsController } from './forums.controller';
import { ForumsService } from './forums.service';
import { ProfileMediaModule } from '../profile-media/profile-media.module';

@Module({
  imports: [PrismaModule, ProfileMediaModule],
  controllers: [ForumsController],
  providers: [ForumsService],
  exports: [ForumsService],
})
export class ForumsModule {}
