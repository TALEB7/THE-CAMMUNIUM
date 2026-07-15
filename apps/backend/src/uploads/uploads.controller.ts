import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UploadsService } from './uploads.service';

// Allowed MIME types
const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

const ALLOWED_DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-rar-compressed',
  'text/plain',
  'text/csv',
];

const ALL_ALLOWED_MIMES = [...ALLOWED_IMAGE_MIMES, ...ALLOWED_DOC_MIMES];

const MAX_DOC_SIZE = 20 * 1024 * 1024;   // 20 MB

const storage = diskStorage({
  destination: (_req, _file, cb) => {
    // Default to 'listings', will be overridden by param
    const folder = (_req as any).params?.folder || 'listings';
    const dest = join(process.cwd(), 'uploads', folder);
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uniqueId}${ext}`);
  },
});

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (err: Error | null, accept: boolean) => void,
) => {
  if (ALL_ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `Type de fichier non autorisé: ${file.mimetype}. Types acceptés: images (JPEG, PNG, WebP, GIF, AVIF), documents (PDF, Word, Excel, PPT, ZIP, TXT, CSV).`,
      ),
      false,
    );
  }
};

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post(':folder')
  @ApiOperation({ summary: 'Upload files (max 10 files, 20MB each)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage,
      fileFilter,
      limits: { fileSize: MAX_DOC_SIZE },
    }),
  )
  uploadFiles(
    @Param('folder') folder: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // Validate folder name (whitelist)
    const allowedFolders = ['listings', 'avatars', 'documents', 'groups', 'photos', 'videos', 'music'];
    if (!allowedFolders.includes(folder)) {
      throw new BadRequestException(`Dossier non autorisé: ${folder}`);
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('Aucun fichier envoyé');
    }

    return this.uploadsService.processUploadedFiles(files, folder);
  }
}
