import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getPosts } from "@/lib/posts";
import { Feed } from "@/components/Feed";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

async function Sidebar() {
  const [userCount, postCount, likeCount, voices] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.like.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { posts: { _count: "desc" } },
      select: {
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        _count: { select: { posts: true } },
      },
    }),
  ]);

  const stats = [
    ["People", userCount],
    ["Posts", postCount],
    ["Likes", likeCount],
  ] as const;

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-24 space-y-4">
        <div className="rounded-card border border-hairline bg-ink-raised/50 p-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
            The square today
          </h2>
          <dl className="mt-3 grid grid-cols-3 gap-2">
            {stats.map(([label, value]) => (
              <div key={label}>
                <dd className="font-display text-2xl font-extrabold tabular-nums text-bone">
                  {value}
                </dd>
                <dt className="text-[11px] text-faint">{label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-card border border-hairline bg-ink-raised/50 p-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
            Most talkative
          </h2>
          <ul className="mt-3 space-y-3">
            {voices.map((person) => (
              <li key={person.username}>
                <Link
                  href={`/u/${person.username}`}
                  className="flex items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-ink-high"
                >
                  <Avatar
                    username={person.username}
                    displayName={person.displayName}
                    avatarUrl={person.avatarUrl}
                    size={34}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-bone">
                      {person.displayName}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-faint">
                      {person._count.posts} posts
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="px-1 text-[11px] leading-relaxed text-faint">
          Commons keeps one shared timeline, newest first. No ranking, no
          recommendations — just the order things were said in.
        </p>
      </div>
    </aside>
  );
}

export default async function HomePage() {
  const viewerId = await getSessionUserId();
  const posts = await getPosts({ viewerId, take: 30 });

  return (
    <div className="flex gap-8 pt-8">
      <div className="min-w-0 flex-1">
        <div className="mb-6">
          <h1 className="font-display text-[clamp(2rem,5vw,2.9rem)] leading-[1.05] font-extrabold tracking-tight">
            Everything said here,
            <br />
            <span className="text-persimmon">in the order it was said.</span>
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
            One timeline. Newest at the top. Say something, or pull a thread
            someone else started.
          </p>
        </div>

        <Feed initialPosts={posts} />
      </div>

      <Sidebar />
    </div>
  );
}
