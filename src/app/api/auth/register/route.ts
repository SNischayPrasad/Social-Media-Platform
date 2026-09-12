import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { registerSchema, fieldErrors } from "@/lib/validators";
import { ok, fail } from "@/lib/api";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return fail("Please fix the highlighted fields", 422, fieldErrors(parsed.error));
  }

  const { username, email, password, displayName } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }] },
    select: { username: true, email: true },
  });
  if (existing) {
    return fail("That account already exists", 409, {
      [existing.username === username.toLowerCase() ? "username" : "email"]:
        "Already taken",
    });
  }

  const user = await prisma.user.create({
    data: {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      displayName,
      passwordHash: await hashPassword(password),
    },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  });

  await createSession(user.id);
  return ok({ user }, 201);
}
