"use client";

import { createContext, useContext } from "react";
import type { CurrentUser } from "@/lib/auth";

const SessionContext = createContext<CurrentUser | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: CurrentUser | null;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

/** The signed-in user, or null when browsing anonymously. */
export function useSession() {
  return useContext(SessionContext);
}
