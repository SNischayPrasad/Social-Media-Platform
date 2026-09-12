import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getPosts } from "@/lib/posts";
import { ok, notFound } from "@/lib/api";

type Params = { params: Promise<{ username: string }> };

/** GET /api/users/:username — public profile plus that user's posts. */
export async function GET(_request: Request, { params }: Params) {
  const { username } = await params;
  const viewerId = await getSessionUserId();

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { posts: true, followers: true, following: true } },
    },
  });
  if (!user) return notFound("User");

  const isFollowing = viewerId
    ? !!(await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
      }))
    : false;

  return ok({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      joinedAt: user.createdAt.toISOString(),
      postCount: user._count.posts,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      isFollowing,
      isMe: viewerId === user.id,
    },
    posts: await getPosts({ viewerId, authorId: user.id, take: 50 }),
  });
}
