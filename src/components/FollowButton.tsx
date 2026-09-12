"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./SessionProvider";

export function FollowButton({
  username,
  initialFollowing,
  initialFollowers,
}: {
  username: string;
  initialFollowing: boolean;
  initialFollowers: number;
}) {
  const viewer = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(initialFollowers);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!viewer) return router.push("/login");

    setPending(true);
    const response = await fetch(`/api/users/${username}/follow`, {
      method: following ? "DELETE" : "POST",
    });
    setPending(false);
    if (!response.ok) return;

    const data = await response.json();
    setFollowing(data.following);
    setFollowers(data.followerCount);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={pending}
        className={`rounded-full px-5 py-2 text-sm font-semibold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60 ${
          following
            ? "border border-hairline text-muted hover:border-persimmon/60 hover:text-persimmon"
            : "bg-persimmon text-ink"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>
      <span className="font-mono text-[12px] tabular-nums text-faint">
        {followers} followers
      </span>
    </div>
  );
}
