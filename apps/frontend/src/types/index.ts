// ── Common ──────────────────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  total: number;
  totalPages: number;
}

// ── User ─────────────────────────────────────────────────────────────────────

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
}

// ── Groups ───────────────────────────────────────────────────────────────────

export interface GroupMember {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
  user: UserSummary;
}

export interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string | null;
  avatarUrl?: string | null;
  category?: string | null;
  isPublic: boolean;
  ownerId: string;
  memberCount: number;
  postCount: number;
  members: GroupMember[];
  _count: { members: number; posts: number };
  createdAt: string;
}

export interface Attachment {
  url: string;
  name: string;
  type: string;
  size?: number;
}

export interface GroupPost {
  id: string;
  groupId: string;
  content: string;
  images: string[];
  attachments?: Attachment[];
  isPinned: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: UserSummary;
  comments?: GroupComment[];
}

export interface GroupComment {
  id: string;
  content: string;
  createdAt: string;
  author: UserSummary;
}

export interface GroupsResponse extends Pagination {
  groups: Group[];
}

export interface GroupPostsResponse extends Pagination {
  posts: GroupPost[];
}

// ── Forums ───────────────────────────────────────────────────────────────────

export interface Forum {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  _count: { posts: number };
}

export interface ForumPost {
  id: string;
  forumId: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  author: UserSummary;
  comments?: ForumComment[];
  _count: { likes: number; comments: number };
}

export interface ForumComment {
  id: string;
  content: string;
  createdAt: string;
  author: UserSummary;
  replies?: ForumComment[];
}

export interface ForumPostsResponse extends Pagination {
  posts: ForumPost[];
}

// ── Marketplace ──────────────────────────────────────────────────────────────

export interface ListingSummary {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  imageUrls: string[];
  category?: string;
  condition?: string;
  createdAt: string;
  seller: UserSummary;
  _count: { favorites: number };
}

// ── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  isRead: boolean;
  createdAt: string;
}

// ── Messages ─────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  participants: UserSummary[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: UserSummary;
}
