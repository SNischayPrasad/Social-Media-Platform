import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { ok, fail, notFound, unauthorized } from "@/lib/api";

type Params = { params: Promise<{ username: string }> };

async function target(username: string) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
}

/** POST /api/users/:username/follow — follow a user. Requires auth. */
export async function POST(_request: Request, { params }: Params) {
  const followerId = await getSessionUserId();
  if (!followerId) return unauthorized();

  const user = await target((await params).username);
  if (!user) return notFound("User");
  if (user.id === followerId) return fail("You cannot follow yourself", 400);

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId: user.id } },
    create: { followerId, followingId: user.id },
    update: {},
  });

  return ok({
    following: true,
    followerCount: await prisma.follow.count({ where: { followingId: user.id } }),
  });
}

/** DELETE /api/users/:username/follow — unfollow. Requires auth. */
export async function DELETE(_request: Request, { params }: Params) {
  const followerId = await getSessionUserId();
  if (!followerId) return unauthorized();

  const user = await target((await params).username);
  if (!user) return notFound("User");

  await prisma.follow.deleteMany({ where: { followerId, followingId: user.id } });

  return ok({
    following: false,
    followerCount: await prisma.follow.count({ where: { followingId: user.id } }),
  });
}
