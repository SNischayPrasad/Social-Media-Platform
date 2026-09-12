"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./SessionProvider";
import { Avatar } from "./Avatar";
import { TimeAgo } from "./TimeAgo";
import type { FeedPost } from "@/lib/posts";

export type Comment = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <path
        d="M12 20.7 4.3 13a4.9 4.9 0 0 1 0-7 4.9 4.9 0 0 1 7 0l.7.7.7-.7a4.9 4.9 0 0 1 7 0 4.9 4.9 0 0 1 0 7Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <path
        d="M20 12a7 7 0 0 1-7 7H7l-3.5 2.5V12a7 7 0 0 1 7-7h2.5a7 7 0 0 1 7 7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PostCard({
  post,
  onRemoved,
  isLast = false,
}: {
  post: FeedPost;
  onRemoved?: (id: string) => void;
  isLast?: boolean;
}) {
  const viewer = useSession();
  const router = useRouter();

  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [beat, setBeat] = useState(0);

  async function toggleLike() {
    if (!viewer) return router.push("/login");

    // Optimistic: flip locally, then reconcile with the server's count.
    const next = !liked;
    setLiked(next);
    setLikeCount((count) => count + (next ? 1 : -1));
    if (next) setBeat((b) => b + 1);

    const response = await fetch(`/api/posts/${post.id}/like`, {
      method: next ? "POST" : "DELETE",
    });
    if (response.ok) {
      const data = await response.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } else {
      setLiked(!next);
      setLikeCount((count) => count + (next ? -1 : 1));
    }
  }

  async function toggleComments() {
    const next = !open;
    setOpen(next);
    if (next && comments === null) {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      const data = await response.json();
      setComments(data.comments);
    }
  }

  async function addComment(event: React.SyntheticEvent) {
    event.preventDefault();
    if (!viewer) return router.push("/login");
    if (!draft.trim()) return;

    const body = draft;
    setDraft("");

    const response = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!response.ok) {
      setDraft(body);
      return;
    }

    const data = await response.json();
    setComments((list) => [...(list ?? []), data.comment]);
    setCommentCount(data.commentCount);
  }

  async function remove() {
    const response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (!response.ok) return;
    if (onRemoved) onRemoved(post.id);
    else router.refresh();
  }

  const mine = viewer?.id === post.author.id;

  return (
    <article className="animate-rise relative flex gap-3 px-1 py-5">
      {/* The spine: one continuous line threading every post in the timeline. */}
      <div className="relative flex flex-col items-center">
        <Link href={`/u/${post.author.username}`} className="relative z-10 rounded-full">
          <Avatar
            username={post.author.username}
            displayName={post.author.displayName}
            avatarUrl={post.author.avatarUrl}
          />
        </Link>
        {!isLast && (
          <span
            aria-hidden="true"
            className="absolute top-11 bottom-[-20px] w-px bg-gradient-to-b from-hairline to-transparent"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <Link
            href={`/u/${post.author.username}`}
            className="font-display text-[15px] font-bold text-bone hover:text-persimmon"
          >
            {post.author.displayName}
          </Link>
          <Link
            href={`/u/${post.author.username}`}
            className="font-mono text-[12px] text-faint hover:text-muted"
          >
            @{post.author.username}
          </Link>
          <span aria-hidden="true" className="text-faint">
            ·
          </span>
          <TimeAgo iso={post.createdAt} />

          {mine && (
            <button
              onClick={remove}
              className="ml-auto font-mono text-[11px] text-faint transition-colors hover:text-persimmon"
              aria-label="Delete this post"
            >
              delete
            </button>
          )}
        </div>

        {post.content && (
          <p className="mt-1.5 whitespace-pre-wrap text-[16px] leading-relaxed text-bone/95">
            {post.content}
          </p>
        )}

        {post.mediaUrl && (
          <div className="mt-3 overflow-hidden rounded-card border border-hairline bg-ink">
            {post.mediaType === "VIDEO" ? (
              <video src={post.mediaUrl} controls className="max-h-[460px] w-full" />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={post.mediaUrl}
                alt=""
                loading="lazy"
                className="max-h-[460px] w-full object-cover"
              />
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-1">
          <button
            onClick={toggleLike}
            aria-pressed={liked}
            aria-label={liked ? "Unlike this post" : "Like this post"}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors ${
              liked ? "text-persimmon" : "text-faint hover:text-persimmon"
            }`}
          >
            <span key={beat} className={beat ? "animate-pop" : ""}>
              <HeartIcon filled={liked} />
            </span>
            <span className="font-mono text-[12px] tabular-nums">{likeCount}</span>
          </button>

          <button
            onClick={toggleComments}
            aria-expanded={open}
            aria-label="Show replies"
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors ${
              open ? "text-lilac" : "text-faint hover:text-lilac"
            }`}
          >
            <ReplyIcon />
            <span className="font-mono text-[12px] tabular-nums">{commentCount}</span>
          </button>
        </div>

        {open && (
          <div className="mt-2 space-y-3 border-l border-hairline pl-4">
            {comments === null && (
              <p className="font-mono text-[11px] text-faint">Loading replies…</p>
            )}

            {comments?.length === 0 && (
              <p className="text-sm text-faint">No replies yet. Start the thread.</p>
            )}

            {comments?.map((comment) => (
              <div key={comment.id} className="flex gap-2.5">
                <Avatar
                  username={comment.user.username}
                  displayName={comment.user.displayName}
                  avatarUrl={comment.user.avatarUrl}
                  size={28}
                />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <Link
                      href={`/u/${comment.user.username}`}
                      className="text-[13px] font-semibold text-bone hover:text-persimmon"
                    >
                      {comment.user.displayName}
                    </Link>
                    <TimeAgo iso={comment.createdAt} />
                  </div>
                  <p className="text-[14px] leading-snug text-bone/85">{comment.body}</p>
                </div>
              </div>
            ))}

            {viewer ? (
              <form onSubmit={addComment} className="flex gap-2 pt-1">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) addComment(e);
                  }}
                  maxLength={300}
                  placeholder="Write a reply"
                  aria-label="Write a reply"
                  className="min-w-0 flex-1 rounded-full border border-hairline bg-ink px-3.5 py-2 text-sm outline-none placeholder:text-faint focus:border-lilac/60"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="rounded-full border border-hairline px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:border-lilac/60 hover:text-bone disabled:opacity-40"
                >
                  Reply
                </button>
              </form>
            ) : (
              <p className="text-sm text-faint">
                <Link href="/login" className="text-persimmon hover:underline">
                  Sign in
                </Link>{" "}
                to reply.
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
