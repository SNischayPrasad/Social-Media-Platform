/**
 * Runs before `next build` on the deploy host.
 *
 * Brings the database in line with the schema, then loads the sample dataset
 * the first time only. Both steps are skipped when DATABASE_URL is absent so a
 * build without a database still succeeds.
 *
 * Seeding is guarded on the users table being empty, so redeploys never wipe
 * posts that real visitors have written.
 */
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("[provision] DATABASE_URL is not set — skipping schema push and seed.");
  process.exit(0);
}

// Neon (and most poolers) hand out a pooled connection for queries and a direct
// one for everything DDL. Schema pushes and the bulk-write seed both need the
// direct connection, so prefer it here when the host provides one.
const directUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
const run = (command) =>
  execSync(command, { stdio: "inherit", env: { ...process.env, DATABASE_URL: directUrl } });

console.log("[provision] Pushing the Prisma schema…");
run("prisma db push --skip-generate");

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

try {
  const users = await prisma.user.count();
  if (users > 0) {
    console.log(`[provision] Database already has ${users} users — skipping seed.`);
  } else {
    console.log("[provision] Empty database — loading the sample dataset…");
    await prisma.$disconnect();
    run("tsx prisma/seed.ts");
  }
} finally {
  await prisma.$disconnect().catch(() => {});
}
