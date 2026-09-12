"use client";

import { useRef, useState } from "react";
import { useSession } from "./SessionProvider";
import { Avatar } from "./Avatar";
import type { FeedPost } from "@/lib/posts";

const LIMIT = 500;

export function Composer({ onPosted }: { onPosted: (post: FeedPost) => void }) {
  const user = useSession();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);

  if (!user) return null;

  const remaining = LIMIT - content.length;
  const canPost = !pending && (content.trim().length > 0 || mediaUrl.trim().length > 0);

  function grow() {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canPost) return;

    setPending(true);
    setError(null);

    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        mediaUrl: mediaUrl.trim() || null,
        mediaType: /\.(mp4|webm|mov)$/i.test(mediaUrl.trim()) ? "VIDEO" : "IMAGE",
      }),
    });
    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.errors?.content ?? data.errors?.mediaUrl ?? data.error);
      return;
    }

    onPosted(data.post);
    setContent("");
    setMediaUrl("");
    setMediaOpen(false);
    if (textarea.current) textarea.current.style.height = "auto";
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-card border border-hairline bg-ink-raised/70 p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] backdrop-blur-sm transition-colors focus-within:border-persimmon/50"
    >
      <div className="flex gap-3">
        <Avatar
          username={user.username}
          displayName={user.displayName}
          avatarUrl={user.avatarUrl}
        />

        <div className="min-w-0 flex-1">
          <textarea
            ref={textarea}
            value={content}
            maxLength={LIMIT}
            onChange={(e) => {
              setContent(e.target.value);
              grow();
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(e);
            }}
            placeholder="Say something to the square"
            rows={2}
            aria-label="Write a post"
            className="w-full resize-none bg-transparent text-[17px] leading-relaxed text-bone outline-none placeholder:text-faint"
          />

          {mediaOpen && (
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://… image or video URL"
              aria-label="Media URL"
              className="mt-2 w-full rounded-lg border border-hairline bg-ink px-3 py-2 font-mono text-xs text-bone outline-none placeholder:text-faint focus:border-persimmon/60"
            />
          )}

          {mediaUrl && (
            <div className="mt-3 overflow-hidden rounded-lg border border-hairline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl}
                alt="Attachment preview"
                className="max-h-64 w-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          )}

          {error && <p className="mt-2 text-sm text-persimmon">{error}</p>}

          <div className="mt-3 flex items-center gap-3 border-t border-hairline pt-3">
            <button
              type="button"
              onClick={() => setMediaOpen((open) => !open)}
              aria-pressed={mediaOpen}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                mediaOpen
                  ? "border-persimmon/60 text-persimmon"
                  : "border-hairline text-muted hover:border-persimmon/40 hover:text-bone"
              }`}
            >
              Media
            </button>

            <span
              className={`ml-auto font-mono text-[11px] ${
                remaining < 40 ? "text-persimmon" : "text-faint"
              }`}
            >
              {remaining}
            </span>

            <button
              type="submit"
              disabled={!canPost}
              className="rounded-full bg-persimmon px-5 py-2 text-sm font-semibold text-ink transition-all hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:bg-ink-high disabled:text-faint disabled:hover:scale-100"
            >
              {pending ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
