import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ── Browse Groups ──

  async getGroups(filters: { category?: string; q?: string; page?: any; limit?: any }) {
    const { category, q, page: pageParam = 1, limit: limitParam = 20 } = filters;
    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 20;
    const where: any = { status: 'ACTIVE', isPublic: true };
    if (category) where.category = category;
    if (q) where.name = { contains: q, mode: 'insensitive' };

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          _count: { select: { members: true, posts: true } },
        },
        orderBy: { memberCount: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.group.count({ where }),
    ]);
    return { groups, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getGroup(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { joinedAt: 'asc' },
          take: 50,
        },
        _count: { select: { members: true, posts: true } },
      },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');
    return group;
  }

  // ── Create / Update / Delete Group ──

  async createGroup(data: {
    ownerId: string;
    name: string;
    description?: string;
    coverImage?: string;
    avatarUrl?: string;
    category?: string;
    isPublic?: boolean;
    rules?: string;
  }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const group = await this.prisma.group.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        slug,
        description: data.description,
        coverImage: data.coverImage,
        avatarUrl: data.avatarUrl,
        category: data.category,
        isPublic: data.isPublic ?? true,
        rules: data.rules,
      },
    });

    // Owner auto-joins as ADMIN
    await this.prisma.groupMember.create({
      data: { groupId: group.id, userId: data.ownerId, role: 'ADMIN' },
    });

    return group;
  }

  async updateGroup(id: string, ownerId: string, data: any) {
    const group = await this.prisma.group.findFirst({ where: { id, ownerId } });
    if (!group) throw new ForbiddenException('Vous n\'êtes pas le propriétaire de ce groupe');
    const updateData = { ...data };
    delete updateData.ownerId;
    return this.prisma.group.update({ where: { id }, data: updateData });
  }

  async deleteGroup(id: string, ownerId: string) {
    const group = await this.prisma.group.findFirst({ where: { id, ownerId } });
    if (!group) throw new ForbiddenException('Vous n\'êtes pas le propriétaire de ce groupe');
    await this.prisma.groupComment.deleteMany({ where: { post: { groupId: id } } });
    await this.prisma.groupPost.deleteMany({ where: { groupId: id } });
    await this.prisma.groupMember.deleteMany({ where: { groupId: id } });
    return this.prisma.group.delete({ where: { id } });
  }

  // ── Membership ──

  async joinGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    const existing = await this.prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
    if (existing) throw new BadRequestException('Vous êtes déjà membre de ce groupe');

    await this.prisma.groupMember.create({ data: { groupId, userId } });
    await this.prisma.group.update({ where: { id: groupId }, data: { memberCount: { increment: 1 } } });
    return { joined: true };
  }

  async leaveGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe non trouvé');
    if (group.ownerId === userId) throw new BadRequestException('Le propriétaire ne peut pas quitter le groupe');

    await this.prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId } } });
    await this.prisma.group.update({ where: { id: groupId }, data: { memberCount: { decrement: 1 } } });
    return { left: true };
  }

  async getMyGroups(userId: string) {
    return this.prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            _count: { select: { members: true, posts: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  // ── Group Posts ──

  async getGroupPosts(groupId: string, pageParam: any = 1, limitParam: any = 20) {
    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 20;
    const [posts, total] = await Promise.all([
      this.prisma.groupPost.findMany({
        where: { groupId, status: 'VISIBLE' },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.groupPost.count({ where: { groupId, status: 'VISIBLE' } }),
    ]);
    return { posts, total, page, totalPages: Math.ceil(total / limit) };
  }

  async createGroupPost(data: {
    groupId: string;
    authorId: string;
    content: string;
    images?: string[];
    attachments?: { url: string; name: string; type: string; size?: number }[];
  }) {
    // Check membership
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: data.groupId, userId: data.authorId } },
    });
    if (!member) throw new ForbiddenException('Vous devez être membre du groupe pour publier');

    const post = await this.prisma.groupPost.create({
      data: {
        groupId: data.groupId,
        authorId: data.authorId,
        content: data.content,
        images: data.images || [],
        attachments: data.attachments || [],
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    await this.prisma.group.update({ where: { id: data.groupId }, data: { postCount: { increment: 1 } } });
    return post;
  }

  async deleteGroupPost(id: string, authorId: string) {
    const post = await this.prisma.groupPost.findFirst({ where: { id, authorId } });
    if (!post) throw new NotFoundException('Publication non trouvée');
    await this.prisma.group.update({ where: { id: post.groupId }, data: { postCount: { decrement: 1 } } });
    return this.prisma.groupPost.delete({ where: { id } });
  }

  // ── Group Comments ──

  async addGroupComment(data: { postId: string; authorId: string; content: string; parentId?: string }) {
    const post = await this.prisma.groupPost.findUnique({ where: { id: data.postId }, select: { groupId: true } });
    if (!post) throw new NotFoundException('Publication non trouvée');

    const comment = await this.prisma.groupComment.create({
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
    await this.prisma.groupPost.update({ where: { id: data.postId }, data: { commentCount: { increment: 1 } } });

    // Broadcast via Redis Pub/Sub → FeedGateway
    await this.redis.publish('group:comments', {
      postId: data.postId,
      groupId: post.groupId,
      comment,
    });

    return comment;
  }

  // ── Likes ──

  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.groupPost.findUnique({
      where: { id: postId },
      select: { id: true, groupId: true, likeCount: true },
    });
    if (!post) throw new NotFoundException('Publication non trouvée');

    const existing = await this.prisma.groupLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    let liked: boolean;
    let likeCount: number;

    if (existing) {
      await this.prisma.groupLike.delete({ where: { postId_userId: { postId, userId } } });
      const updated = await this.prisma.groupPost.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
      liked = false;
      likeCount = updated.likeCount;
    } else {
      await this.prisma.groupLike.create({ data: { postId, userId } });
      const updated = await this.prisma.groupPost.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
      liked = true;
      likeCount = updated.likeCount;
    }

    // Broadcast via Redis Pub/Sub → FeedGateway
    await this.redis.publish('group:likes', {
      postId,
      groupId: post.groupId,
      userId,
      likeCount,
      liked,
    });

    return { liked, likeCount };
  }
}
