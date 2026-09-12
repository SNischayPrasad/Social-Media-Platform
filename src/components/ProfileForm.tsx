"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "./Avatar";
import type { CurrentUser } from "@/lib/auth";

export function ProfileForm({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setSaved(false);

    const response = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio, avatarUrl }),
    });
    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setErrors(data.errors ?? { form: data.error });
      return;
    }

    setSaved(true);
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-hairline bg-ink px-3.5 py-2.5 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-persimmon/60";

  return (
    <form
      onSubmit={submit}
      className="mt-7 space-y-5 rounded-card border border-hairline bg-ink-raised/50 p-6"
    >
      <div className="flex items-center gap-4 border-b border-hairline pb-5">
        <Avatar
          username={user.username}
          displayName={displayName || user.displayName}
          avatarUrl={avatarUrl || null}
          size={64}
        />
        <div>
          <p className="font-display text-lg font-bold">{displayName || "—"}</p>
          <p className="font-mono text-[12px] text-faint">@{user.username}</p>
        </div>
      </div>

      <div>
        <label
          htmlFor="displayName"
          className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-faint"
        >
          Display name
        </label>
        <input
          id="displayName"
          value={displayName}
          maxLength={50}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputClass}
        />
        {errors.displayName && (
          <p className="mt-1 text-xs text-persimmon">{errors.displayName}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="bio"
          className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-faint"
        >
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          rows={3}
          maxLength={280}
          placeholder="A line or two about you"
          onChange={(e) => setBio(e.target.value)}
          className={`${inputClass} resize-none`}
        />
        <p className="mt-1 text-right font-mono text-[11px] text-faint">
          {280 - bio.length}
        </p>
        {errors.bio && <p className="mt-1 text-xs text-persimmon">{errors.bio}</p>}
      </div>

      <div>
        <label
          htmlFor="avatarUrl"
          className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-faint"
        >
          Avatar URL
        </label>
        <input
          id="avatarUrl"
          value={avatarUrl}
          placeholder="https://… leave empty for your monogram"
          onChange={(e) => setAvatarUrl(e.target.value)}
          className={`${inputClass} font-mono text-xs`}
        />
        {errors.avatarUrl && (
          <p className="mt-1 text-xs text-persimmon">{errors.avatarUrl}</p>
        )}
      </div>

      {errors.form && (
        <p role="alert" className="text-sm text-persimmon">
          {errors.form}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-persimmon px-6 py-2.5 font-semibold text-ink transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {saved && (
          <span role="status" className="font-mono text-[12px] text-lilac">
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
