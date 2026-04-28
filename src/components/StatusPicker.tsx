"use client";

import type { Status } from "@/types";
import { useStatuses } from "@/hooks/useStatuses";

const OPTIONS: { value: Status; label: string; emoji: string }[] = [
  { value: "not_visited", label: "Not visited", emoji: "·" },
  { value: "wishlist", label: "Wishlist", emoji: "★" },
  { value: "planned", label: "Planned", emoji: "📅" },
  { value: "visited", label: "Visited", emoji: "✓" }
];

export default function StatusPicker({ parkCode }: { parkCode: string }) {
  const { getStatus, setStatus } = useStatuses();
  const current = getStatus(parkCode);

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {OPTIONS.map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setStatus(parkCode, opt.value)}
            className={`text-sm py-1.5 px-2 rounded-md font-medium border transition-colors ${
              active
                ? "bg-forest-600 text-white border-forest-700"
                : "bg-white dark:bg-forest-800 text-forest-800 dark:text-forest-100 border-bark-100 dark:border-forest-700 hover:bg-forest-50 dark:hover:bg-forest-700"
            }`}
          >
            <span className="mr-1.5">{opt.emoji}</span>{opt.label}
          </button>
        );
      })}
    </div>
  );
}
