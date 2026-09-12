"use client";

import { useState } from "react";
import Link from "next/link";
import { Composer } from "./Composer";
import { PostCard } from "./PostCard";
import { useSession } from "./SessionProvider";
import type { FeedPost } from "@/lib/posts";

export function Feed({ initialPosts }: { initialPosts: FeedPost[] }) {
  const user = useSession();
  const [posts, setPosts] = useState(initialPosts);

  return (
    <div className="space-y-4">
      {user ? (
        <Composer onPosted={(post) => setPosts((list) => [post, ...list])} />
      ) : (
        <div className="rounded-card border border-dashed border-hairline bg-ink-raised/40 p-5">
          <p className="font-display text-lg font-bold">Reading over the fence</p>
          <p className="mt-1 text-sm text-muted">
            Anyone can read the square.{" "}
            <Link href="/register" className="text-persimmon hover:underline">
              Join
            </Link>{" "}
            or{" "}
            <Link href="/login" className="text-persimmon hover:underline">
              sign in
            </Link>{" "}
            to post, like, and reply.
          </p>
        </div>
      )}

      <section aria-label="Timeline" className="divide-y divide-hairline/50">
        {posts.length === 0 ? (
          <p className="py-16 text-center text-muted">
            Nothing here yet. The first post is yours to write.
          </p>
        ) : (
          posts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              isLast={index === posts.length - 1}
              onRemoved={(id) => setPosts((list) => list.filter((p) => p.id !== id))}
            />
          ))
        )}
      </section>
    </div>
  );
}
