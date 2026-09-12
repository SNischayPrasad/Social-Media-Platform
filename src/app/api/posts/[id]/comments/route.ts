import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { createCommentSchema, fieldErrors } from "@/lib/validators";
import { ok, fail, notFound, unauthorized } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const withUser = {
  user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
} as const;

/** GET /api/posts/:id/comments — oldest first. Public. */
export async function GET(_request: Request, { params }: Params) {
  const { id: postId } = await params;
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: withUser,
  });

  return ok({
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
    })),
  });
}

/** POST /api/posts/:id/comments — add a comment. Requires auth. */
export async function POST(request: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const { id: postId } = await params;
  const parsed = createCommentSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return fail("Please fix the highlighted fields", 422, fieldErrors(parsed.error));
  }

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return notFound("Post");

  const comment = await prisma.comment.create({
    data: { body: parsed.data.body.trim(), postId, userId },
    include: withUser,
  });

  return ok(
    {
      comment: {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        user: comment.user,
      },
      commentCount: await prisma.comment.count({ where: { postId } }),
    },
    201,
  );
}
