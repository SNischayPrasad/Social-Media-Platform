import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema, fieldErrors } from "@/lib/validators";
import { ok, fail } from "@/lib/api";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return fail("Please fix the highlighted fields", 422, fieldErrors(parsed.error));
  }

  const identifier = parsed.data.identifier.toLowerCase().trim();
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier }] },
  });

  // Same message either way, so the response doesn't reveal which accounts exist.
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return fail("Incorrect username or password", 401);
  }

  await createSession(user.id);
  return ok({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
  });
}
