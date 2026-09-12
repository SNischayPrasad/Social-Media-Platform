import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { createPostSchema, fieldErrors } from "@/lib/validators";
import { getPosts, postInclude, serializePost } from "@/lib/posts";
import { ok, fail, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/posts — the feed, newest first. Public. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const viewerId = await getSessionUserId();

  const posts = await getPosts({
    viewerId,
    take: Math.min(Number(searchParams.get("limit")) || 20, 50),
    cursor: searchParams.get("cursor"),
    authorId: searchParams.get("author") ?? undefined,
  });

  return ok({ posts, nextCursor: posts.at(-1)?.id ?? null });
}

/** POST /api/posts — create a post. Requires auth. */
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const parsed = createPostSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return fail("Please fix the highlighted fields", 422, fieldErrors(parsed.error));
  }

  const { content, mediaUrl, mediaType } = parsed.data;
  const post = await prisma.post.create({
    data: {
      content: content.trim(),
      mediaUrl: mediaUrl || null,
      mediaType: mediaUrl ? mediaType || "IMAGE" : null,
      authorId: userId,
    },
    include: postInclude,
  });

  return ok({ post: serializePost(post as never) }, 201);
}
