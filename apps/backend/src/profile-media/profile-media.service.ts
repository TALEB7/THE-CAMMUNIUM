import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileMediaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Detect media type from MIME type
   */
  detectType(mimeType: string): 'photo' | 'video' | 'music' | 'document' {
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'music';
    return 'document';
  }

  /**
   * Save a media file to the user's profile media
   */
  async createMedia(data: {
    userId: string;
    url: string;
    mimeType: string;
    name?: string;
    size?: number;
    caption?: string;
    postId?: string;
  }) {
    return this.prisma.profileMedia.create({
      data: {
        userId: data.userId,
        type: this.detectType(data.mimeType),
        url: data.url,
        mimeType: data.mimeType,
        name: data.name,
        size: data.size,
        caption: data.caption,
        postId: data.postId,
      },
    });
  }

  /**
   * Get all media for the current user filtered by type
   */
  async getMyMedia(userId: string, type?: string) {
    return this.prisma.profileMedia.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get public media for any user by id filtered by type
   */
  async getUserMedia(userId: string, type?: string) {
    return this.prisma.profileMedia.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete a media entry (only owner can delete)
   */
  async deleteMedia(id: string, userId: string) {
    const media = await this.prisma.profileMedia.findFirst({ where: { id, userId } });
    if (!media) return null;
    return this.prisma.profileMedia.delete({ where: { id } });
  }
}
