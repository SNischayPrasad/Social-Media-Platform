import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { postInclude, serializePost } from "@/lib/posts";
import { ok, fail, notFound, unauthorized } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/** GET /api/posts/:id — a single post with its comments. Public. */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const viewerId = await getSessionUserId();

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      ...postInclude,
      ...(viewerId
        ? { likes: { where: { userId: viewerId }, select: { id: true } } }
        : {}),
    },
  });
  if (!post) return notFound("Post");

  const comments = await prisma.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  return ok({
    post: serializePost(post as never),
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
    })),
  });
}

/** DELETE /api/posts/:id — author only. */
export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) return notFound("Post");
  if (post.authorId !== userId) return fail("You can only delete your own posts", 403);

  await prisma.post.delete({ where: { id } });
  return ok({ success: true });
}
