"use client";

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

function relative(iso: string) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return "just now";

  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, secondsPer] of UNITS) {
    if (seconds >= secondsPer) {
      return format.format(-Math.floor(seconds / secondsPer), unit);
    }
  }
  return format.format(-seconds, "second");
}

export function TimeAgo({ iso, className = "" }: { iso: string; className?: string }) {
  return (
    <time
      dateTime={iso}
      title={new Date(iso).toLocaleString()}
      className={`font-mono text-[11px] tracking-tight text-faint ${className}`}
      suppressHydrationWarning
    >
      {relative(iso)}
    </time>
  );
}
