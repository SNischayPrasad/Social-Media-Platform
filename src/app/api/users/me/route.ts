import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { updateProfileSchema, fieldErrors } from "@/lib/validators";
import { ok, fail, unauthorized } from "@/lib/api";

/** PATCH /api/users/me — update your own profile. Requires auth. */
export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const parsed = updateProfileSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return fail("Please fix the highlighted fields", 422, fieldErrors(parsed.error));
  }

  const { displayName, bio, avatarUrl } = parsed.data;
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(displayName !== undefined ? { displayName } : {}),
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      bio: true,
      avatarUrl: true,
    },
  });

  return ok({ user });
}
