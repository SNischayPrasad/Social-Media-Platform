"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "./SessionProvider";
import { Avatar } from "./Avatar";

export function TopBar() {
  const user = useSession();
  const router = useRouter();
  const pathname = usePathname();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-[22px] font-extrabold tracking-tight text-bone">
            Commons
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-faint transition-colors group-hover:text-persimmon sm:inline">
            public square
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link
                href={`/u/${user.username}`}
                className="flex items-center gap-2 rounded-full border border-hairline px-2 py-1.5 pr-3 transition-colors hover:border-persimmon/60 hover:bg-ink-raised"
              >
                <Avatar
                  username={user.username}
                  displayName={user.displayName}
                  avatarUrl={user.avatarUrl}
                  size={26}
                />
                <span className="hidden text-sm font-medium sm:inline">
                  {user.displayName}
                </span>
              </Link>
              <button
                onClick={signOut}
                className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-bone"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              {pathname !== "/login" && (
                <Link
                  href="/login"
                  className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-bone"
                >
                  Sign in
                </Link>
              )}
              <Link
                href="/register"
                className="rounded-full bg-persimmon px-4 py-2 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-95"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
