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
    const dirs = ['', 'listings', 'avatars', 'documents'];
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
    const baseUrl = this.config.get('API_BASE_URL', 'http://localhost:4000');
    return `${baseUrl}/api/uploads/${folder}/${filename}`;
  }

  /**
   * Process uploaded files and return their public URLs.
   */
  processUploadedFiles(
    files: Express.Multer.File[],
    folder: string,
  ): { urls: string[] } {
    const urls = files.map((file) => {
      // file.filename is set by multer diskStorage
      return this.getFileUrl(folder, file.filename);
    });

    this.logger.log(
      `Uploaded ${files.length} file(s) to ${folder}: ${urls.join(', ')}`,
    );

    return { urls };
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
