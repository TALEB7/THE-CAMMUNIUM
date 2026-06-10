import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>('AI_SERVICE_URL') ?? 'http://localhost:8000',
        timeout: 120000, // CNIE OCR inference takes up to 60s; 120s gives sufficient margin
      }),
    }),
  ],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
