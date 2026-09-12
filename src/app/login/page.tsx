import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export default async function LoginPage() {
  if (await getSessionUserId()) redirect("/");

  return (
    <AuthForm
      mode="login"
      title="Sign in"
      subtitle="Pick up where the conversation left off."
      endpoint="/api/auth/login"
      submitLabel="Sign in"
      fields={[
        {
          name: "identifier",
          label: "Username or email",
          placeholder: "ada",
          autoComplete: "username",
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          placeholder: "••••••••",
          autoComplete: "current-password",
        },
      ]}
      footer={
        <>
          No account yet?{" "}
          <Link href="/register" className="text-persimmon hover:underline">
            Join the square
          </Link>
        </>
      }
    />
  );
}
