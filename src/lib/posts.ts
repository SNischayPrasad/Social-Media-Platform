import { prisma } from "./prisma";

export const postInclude = {
  author: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
  _count: { select: { likes: true, comments: true } },
} as const;

export type FeedPost = {
  id: string;
  content: string;
  mediaUrl: string | null;
  mediaType: "IMAGE" | "VIDEO" | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

type RawPost = Awaited<ReturnType<typeof prisma.post.findMany>>[number] & {
  author: FeedPost["author"];
  _count: { likes: number; comments: number };
  likes?: { id: string }[];
};

export function serializePost(post: RawPost): FeedPost {
  return {
    id: post.id,
    content: post.content,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    createdAt: post.createdAt.toISOString(),
    author: post.author,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByMe: (post.likes?.length ?? 0) > 0,
  };
}

/**
 * Loads posts newest-first. When `viewerId` is given, each post also reports
 * whether that viewer has already liked it.
 */
export async function getPosts(opts: {
  viewerId?: string | null;
  authorId?: string;
  take?: number;
  cursor?: string | null;
}): Promise<FeedPost[]> {
  const { viewerId, authorId, take = 20, cursor } = opts;

  const posts = await prisma.post.findMany({
    where: authorId ? { authorId } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      ...postInclude,
      ...(viewerId
        ? { likes: { where: { userId: viewerId }, select: { id: true } } }
        : {}),
    },
  });

  return (posts as unknown as RawPost[]).map(serializePost);
}
