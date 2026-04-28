"use client";

import type { Status } from "@/types";

export type Filters = {
  search: string;
  state: string;
  status: Status | "all";
};

export default function FilterBar({
  filters,
  setFilters,
  states,
  total
}: {
  filters: Filters;
  setFilters: (next: Filters) => void;
  states: string[];
  total: number;
}) {
  return (
    <div className="border-b border-bark-100 dark:border-forest-800 px-4 py-3 space-y-2 bg-cream/60 dark:bg-forest-900/60">
      <input
        type="text"
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        placeholder="Search parks…"
        className="w-full px-3 py-2 rounded-md border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm placeholder:text-bark-400 dark:placeholder:text-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-400"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={filters.state}
          onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          className="px-2 py-1.5 rounded-md border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as Filters["status"] })}
          className="px-2 py-1.5 rounded-md border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="not_visited">Not visited</option>
          <option value="wishlist">Wishlist</option>
          <option value="planned">Planned</option>
          <option value="visited">Visited</option>
        </select>
      </div>
      <div className="text-xs text-bark-500 dark:text-forest-300">{total} parks</div>
    </div>
  );
}
