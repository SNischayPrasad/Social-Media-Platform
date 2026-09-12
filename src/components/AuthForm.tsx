"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
};

/**
 * Shared shell for sign in and join. Both post JSON to an auth endpoint and
 * surface per-field messages the API sends back.
 */
export function AuthForm({
  mode,
  title,
  subtitle,
  endpoint,
  fields,
  submitLabel,
  footer,
}: {
  mode: "login" | "register";
  title: string;
  subtitle: string;
  endpoint: string;
  fields: Field[];
  submitLabel: string;
  footer: React.ReactNode;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setFormError(null);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();

    if (!response.ok) {
      setPending(false);
      setErrors(data.errors ?? {});
      if (!data.errors) setFormError(data.error);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center py-10">
      <div className="rounded-card border border-hairline bg-ink-raised/60 p-7 backdrop-blur-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-persimmon">
          {mode === "login" ? "Welcome back" : "New here"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-muted">{subtitle}</p>

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {fields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-faint"
              >
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                }
                aria-invalid={!!errors[field.name]}
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                className={`w-full rounded-lg border bg-ink px-3.5 py-2.5 text-[15px] outline-none transition-colors placeholder:text-faint ${
                  errors[field.name]
                    ? "border-persimmon"
                    : "border-hairline focus:border-persimmon/60"
                }`}
              />
              {errors[field.name] && (
                <p id={`${field.name}-error`} className="mt-1 text-xs text-persimmon">
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}

          {formError && (
            <p role="alert" className="rounded-lg bg-persimmon/10 px-3 py-2 text-sm text-persimmon">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-persimmon py-2.5 font-semibold text-ink transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
          >
            {pending ? "One moment…" : submitLabel}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">{footer}</p>
      </div>

      {mode === "login" && (
        <div className="mt-4 rounded-card border border-dashed border-hairline p-4 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
            Demo account
          </p>
          <p className="mt-1.5 font-mono text-[13px] text-bone">
            ada · <span className="text-lilac">commons123</span>
          </p>
          <p className="mt-1 text-[11px] text-faint">
            Any seeded username works with the same password.
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-faint">
        <Link href="/" className="hover:text-muted">
          ← Back to the square
        </Link>
      </p>
    </div>
  );
}
