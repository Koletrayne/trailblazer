"use client";

import Image from "next/image";

export default function UserAvatar({
  avatar,
  image,
  name,
  size = 30
}: {
  avatar?: string;
  image?: string | null;
  name?: string | null;
  size?: number;
}) {
  if (avatar) {
    return (
      <div
        style={{ width: size, height: size, fontSize: Math.round(size * 0.58) }}
        className="rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center select-none leading-none"
      >
        <span>{avatar}</span>
      </div>
    );
  }
  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? "User"}
        width={size}
        height={size}
        className="rounded-full"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className="rounded-full bg-forest-600 text-white flex items-center justify-center font-bold select-none"
    >
      {name?.[0]?.toUpperCase() ?? "U"}
    </div>
  );
}

/** Nature-themed emoji avatars to choose from. */
export const AVATAR_CHOICES = [
  "🏔", "🌲", "🏕", "🥾", "🧭", "🗺", "🔭", "⛺️",
  "🦌", "🦅", "🐻", "🦬", "🌄", "🌌", "🍂", "🔥",
  "🌵", "🌊", "❄️", "🏞", "🧗", "🚵", "🛶", "🌟"
];
