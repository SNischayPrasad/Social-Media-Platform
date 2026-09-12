import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit profile — Commons" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-xl pt-10">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-persimmon">
        Your account
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
        Edit profile
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        This is what people see next to everything you post.
      </p>

      <ProfileForm user={user} />
    </div>
  );
}
