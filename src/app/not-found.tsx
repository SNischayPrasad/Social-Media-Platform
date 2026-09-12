import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-persimmon">
        404
      </p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">
        Nothing at this address
      </h1>
      <p className="mt-2 max-w-sm text-muted">
        The page or person you were looking for isn&apos;t here.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-persimmon px-6 py-2.5 font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-95"
      >
        Back to the square
      </Link>
    </div>
  );
}
