import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { getPosts } from "@/lib/posts";
import { Avatar } from "@/components/Avatar";
import { PostCard } from "@/components/PostCard";
import { FollowButton } from "@/components/FollowButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }> };

async function loadProfile(username: string) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { posts: true, followers: true, following: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await loadProfile((await params).username);
  if (!profile) return { title: "Not found — Commons" };
  return {
    title: `${profile.displayName} (@${profile.username}) — Commons`,
    description: profile.bio ?? `${profile.displayName} on Commons.`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await loadProfile(username);
  if (!profile) notFound();

  const viewerId = await getSessionUserId();
  const isMe = viewerId === profile.id;

  const [posts, isFollowing] = await Promise.all([
    getPosts({ viewerId, authorId: profile.id, take: 50 }),
    viewerId && !isMe
      ? prisma.follow
          .findUnique({
            where: {
              followerId_followingId: { followerId: viewerId, followingId: profile.id },
            },
          })
          .then(Boolean)
      : Promise.resolve(false),
  ]);

  const joined = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const counts = [
    ["Posts", profile._count.posts],
    ["Followers", profile._count.followers],
    ["Following", profile._count.following],
  ] as const;

  return (
    <div className="mx-auto max-w-2xl pt-8">
      <header className="rounded-card border border-hairline bg-ink-raised/50 p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar
            username={profile.username}
            displayName={profile.displayName}
            avatarUrl={profile.avatarUrl}
            size={76}
          />

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold tracking-tight">
              {profile.displayName}
            </h1>
            <p className="font-mono text-[13px] text-faint">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-bone/90">
                {profile.bio}
              </p>
            )}
            <p className="mt-2 font-mono text-[11px] text-faint">Joined {joined}</p>
          </div>

          <div className="ml-auto">
            {isMe ? (
              <Link
                href="/settings"
                className="rounded-full border border-hairline px-5 py-2 text-sm font-semibold text-muted transition-colors hover:border-persimmon/60 hover:text-persimmon"
              >
                Edit profile
              </Link>
            ) : (
              <FollowButton
                username={profile.username}
                initialFollowing={isFollowing}
                initialFollowers={profile._count.followers}
              />
            )}
          </div>
        </div>

        <dl className="mt-5 flex gap-6 border-t border-hairline pt-4">
          {counts.map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <dd className="font-display text-lg font-bold tabular-nums">{value}</dd>
              <dt className="font-mono text-[11px] uppercase tracking-[0.15em] text-faint">
                {label}
              </dt>
            </div>
          ))}
        </dl>
      </header>

      <h2 className="mt-8 mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        Posts
      </h2>

      <section className="divide-y divide-hairline/50">
        {posts.length === 0 ? (
          <p className="py-14 text-center text-muted">
            {isMe ? "You haven't posted yet." : "Nothing posted yet."}
          </p>
        ) : (
          posts.map((post, index) => (
            <PostCard key={post.id} post={post} isLast={index === posts.length - 1} />
          ))
        )}
      </section>
    </div>
  );
}
