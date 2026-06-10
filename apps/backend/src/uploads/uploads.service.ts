import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    const dirs = ['', 'listings', 'avatars', 'documents', 'groups'];
    for (const dir of dirs) {
      const fullPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        this.logger.log(`Created upload directory: ${fullPath}`);
      }
    }
  }

  /**
   * Returns the public URL for an uploaded file.
   * In dev: serves from /api/uploads/...
   * In prod: would return S3/R2 URL
   */
  getFileUrl(folder: string, filename: string): string {
    // Return relative path so any client (localhost or LAN) can resolve it
    return `/api/uploads/${folder}/${filename}`;
  }

  /**
   * Process uploaded files and return their public URLs + metadata.
   */
  processUploadedFiles(
    files: Express.Multer.File[],
    folder: string,
  ): { urls: string[]; files: { url: string; name: string; type: string; size: number }[] } {
    const urls: string[] = [];
    const filesMeta: { url: string; name: string; type: string; size: number }[] = [];

    for (const file of files) {
      const url = this.getFileUrl(folder, file.filename);
      urls.push(url);
      filesMeta.push({
        url,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
      });
    }

    this.logger.log(
      `Uploaded ${files.length} file(s) to ${folder}: ${urls.join(', ')}`,
    );

    return { urls, files: filesMeta };
  }

  /**
   * Delete a file by its URL (for cleanup).
   */
  deleteByUrl(url: string): boolean {
    try {
      // Extract relative path from URL: /api/uploads/listings/xxx.jpg
      const match = url.match(/\/uploads\/(.+)$/);
      if (!match) return false;

      const filePath = path.join(this.uploadDir, match[1]);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Deleted file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error}`);
      return false;
    }
  }
}
