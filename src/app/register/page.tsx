import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export default async function RegisterPage() {
  if (await getSessionUserId()) redirect("/");

  return (
    <AuthForm
      mode="register"
      title="Join the square"
      subtitle="Claim a handle and start posting in under a minute."
      endpoint="/api/auth/register"
      submitLabel="Create account"
      fields={[
        {
          name: "displayName",
          label: "Display name",
          placeholder: "Ada Lovelace",
          autoComplete: "name",
        },
        {
          name: "username",
          label: "Username",
          placeholder: "ada",
          autoComplete: "username",
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          placeholder: "ada@example.com",
          autoComplete: "email",
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          placeholder: "At least 8 characters",
          autoComplete: "new-password",
        },
      ]}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-persimmon hover:underline">
            Sign in
          </Link>
        </>
      }
    />
  );
}
