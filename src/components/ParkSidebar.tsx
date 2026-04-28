"use client";

import type { Park, Status } from "@/types";
import StatusBadge from "./StatusBadge";

export default function ParkSidebar({
  parks,
  statusOf,
  onSelect,
  loading
}: {
  parks: Park[];
  statusOf: (code: string) => Status;
  onSelect: (p: Park) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="p-6 text-sm text-bark-500 dark:text-forest-300">Loading parks…</div>
    );
  }

  if (parks.length === 0) {
    return (
      <div className="p-6 text-sm text-bark-500 dark:text-forest-300">
        No parks match your filters.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-bark-100 dark:divide-forest-800 scroll-thin overflow-y-auto h-full">
      {parks.map((p) => (
        <li key={p.parkCode}>
          <button
            onClick={() => onSelect(p)}
            className="w-full text-left px-4 py-3 hover:bg-cream dark:hover:bg-forest-800 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-sm text-forest-800 dark:text-forest-100">
                {p.fullName}
              </div>
              <StatusBadge status={statusOf(p.parkCode)} />
            </div>
            <div className="text-xs text-bark-500 dark:text-forest-300 mt-0.5">{p.states}</div>
          </button>
        </li>
      ))}
    </ul>
  );
}
