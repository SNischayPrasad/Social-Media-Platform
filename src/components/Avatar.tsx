/* eslint-disable @next/next/no-img-element */

const PALETTE = [
  ["#ff5c4d", "#ffb08a"],
  ["#b9a4e0", "#7c6bb0"],
  ["#5cc8b8", "#2f8d80"],
  ["#f0b429", "#c2701a"],
  ["#6ba8ff", "#3f63c4"],
  ["#ff7ab0", "#c2497e"],
] as const;

function seedOf(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

/**
 * Shows the user's picture when they have one, and otherwise a monogram on a
 * gradient derived from their username — so a given person looks the same
 * everywhere without needing an upload.
 */
export function Avatar({
  username,
  displayName,
  avatarUrl,
  size = 44,
  className = "",
}: {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const [from, to] = PALETTE[seedOf(username) % PALETTE.length];
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-hairline ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(140deg, ${from}, ${to})`,
      }}
      aria-hidden="true"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="font-display font-bold text-ink"
          style={{ fontSize: size * 0.38 }}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
