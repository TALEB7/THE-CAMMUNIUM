import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  companyCreationId?: string;

  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
