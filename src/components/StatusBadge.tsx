import type { Status } from "@/types";

const COLORS: Record<Status, string> = {
  not_visited: "bg-ash/20 text-bark-700 dark:bg-bark-700 dark:text-bark-100",
  wishlist: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  planned: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  visited: "bg-forest-100 text-forest-800 dark:bg-forest-700 dark:text-forest-100"
};

const LABEL: Record<Status, string> = {
  not_visited: "Not visited",
  wishlist: "Wishlist",
  planned: "Planned",
  visited: "Visited"
};

export default function StatusBadge({ status, size = "sm" }: { status: Status; size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full whitespace-nowrap shrink-0 ${COLORS[status]} ${
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
      } font-medium`}
    >
      {LABEL[status]}
    </span>
  );
}

export const STATUS_LABEL = LABEL;
