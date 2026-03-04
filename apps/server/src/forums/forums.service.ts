import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ForumsService {
  constructor(private prisma: PrismaService) {}

  // ── Forums CRUD ──

  async getForums() {
    return this.prisma.forum.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
  }

  async getForumBySlug(slug: string) {
    const forum = await this.prisma.forum.findUnique({ where: { slug } });
    if (!forum) throw new NotFoundException('Forum non trouvé');
    return forum;
  }

  async createForum(data: { name: string; slug: string; description?: string; icon?: string; color?: string }) {
    return this.prisma.forum.create({ data });
  }

  // ── Posts ──

  async getForumPosts(forumId: string, page = 1, limit = 20) {
    const [posts, total] = await Promise.all([
      this.prisma.forumPost.findMany({
        where: { forumId, status: 'PUBLISHED' },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          _count: { select: { comments: true, likes: true } },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.forumPost.count({ where: { forumId, status: 'PUBLISHED' } }),
    ]);
    return { posts, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getPost(id: string) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        forum: { select: { id: true, name: true, slug: true } },
        comments: {
          where: { status: 'VISIBLE', parentId: null },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            replies: {
              include: {
                author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { comments: true, likes: true } },
      },
    });
    if (!post) throw new NotFoundException('Publication non trouvée');

    // Increment view count
    await this.prisma.forumPost.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    return post;
  }

  async createPost(data: { forumId: string; authorId: string; title: string; content: string; tags?: string[] }) {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const post = await this.prisma.forumPost.create({
      data: {
        forumId: data.forumId,
        authorId: data.authorId,
        title: data.title,
        slug,
        content: data.content,
        tags: data.tags || [],
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    // Increment forum post count
    await this.prisma.forum.update({ where: { id: data.forumId }, data: { postCount: { increment: 1 } } });

    return post;
  }

  async updatePost(id: string, authorId: string, data: { title?: string; content?: string; tags?: string[] }) {
    const post = await this.prisma.forumPost.findFirst({ where: { id, authorId } });
    if (!post) throw new NotFoundException('Publication non trouvée');
    return this.prisma.forumPost.update({ where: { id }, data });
  }

  async deletePost(id: string, authorId: string) {
    const post = await this.prisma.forumPost.findFirst({ where: { id, authorId } });
    if (!post) throw new NotFoundException('Publication non trouvée');
    await this.prisma.forum.update({ where: { id: post.forumId }, data: { postCount: { decrement: 1 } } });
    return this.prisma.forumPost.delete({ where: { id } });
  }

  // ── Comments ──

  async addComment(data: { postId: string; authorId: string; content: string; parentId?: string }) {
    const comment = await this.prisma.forumComment.create({
      data: {
        postId: data.postId,
        authorId: data.authorId,
        content: data.content,
        parentId: data.parentId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    await this.prisma.forumPost.update({ where: { id: data.postId }, data: { commentCount: { increment: 1 } } });
    return comment;
  }

  async deleteComment(id: string, authorId: string) {
    const comment = await this.prisma.forumComment.findFirst({ where: { id, authorId } });
    if (!comment) throw new NotFoundException('Commentaire non trouvé');
    await this.prisma.forumPost.update({ where: { id: comment.postId }, data: { commentCount: { decrement: 1 } } });
    return this.prisma.forumComment.delete({ where: { id } });
  }

  // ── Likes ──

  async toggleLike(postId: string, userId: string) {
    const existing = await this.prisma.forumLike.findUnique({ where: { postId_userId: { postId, userId } } });
    if (existing) {
      await this.prisma.forumLike.delete({ where: { id: existing.id } });
      await this.prisma.forumPost.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
      return { liked: false };
    }
    await this.prisma.forumLike.create({ data: { postId, userId } });
    await this.prisma.forumPost.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
    return { liked: true };
  }

  // ── Admin: pin/lock/hide ──

  async pinPost(id: string, pinned: boolean) {
    return this.prisma.forumPost.update({ where: { id }, data: { isPinned: pinned } });
  }

  async lockPost(id: string, locked: boolean) {
    return this.prisma.forumPost.update({ where: { id }, data: { isLocked: locked } });
  }
}
