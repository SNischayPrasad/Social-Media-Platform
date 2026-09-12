import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { ok, notFound, unauthorized } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

async function count(postId: string) {
  return prisma.like.count({ where: { postId } });
}

/** POST /api/posts/:id/like — like a post. Idempotent. Requires auth. */
export async function POST(_request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const { id: postId } = await params;
  const exists = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!exists) return notFound("Post");

  await prisma.like.upsert({
    where: { userId_postId: { userId, postId } },
    create: { userId, postId },
    update: {},
  });

  return ok({ liked: true, likeCount: await count(postId) });
}

/** DELETE /api/posts/:id/like — remove a like. Idempotent. Requires auth. */
export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const { id: postId } = await params;
  await prisma.like.deleteMany({ where: { userId, postId } });

  return ok({ liked: false, likeCount: await count(postId) });
}
