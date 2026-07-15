import { Module } from '@nestjs/common';
import { ProfileMediaController } from './profile-media.controller';
import { ProfileMediaService } from './profile-media.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProfileMediaController],
  providers: [ProfileMediaService],
  exports: [ProfileMediaService],
})
export class ProfileMediaModule {}
