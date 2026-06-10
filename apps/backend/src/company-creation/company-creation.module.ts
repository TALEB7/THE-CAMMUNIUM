import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CompanyCreationController } from './company-creation.controller';
import { CompanyCreationService } from './company-creation.service';

@Module({
  imports: [PrismaModule],
  controllers: [CompanyCreationController],
  providers: [CompanyCreationService],
  exports: [CompanyCreationService],
})
export class CompanyCreationModule {}
