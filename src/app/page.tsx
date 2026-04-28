"use client";

import { useMemo, useState } from "react";
import { useParks } from "@/hooks/useParks";
import { useStatuses } from "@/hooks/useStatuses";
import ParkMapWrapper from "@/components/ParkMapWrapper";
import ParkSidebar from "@/components/ParkSidebar";
import ParkPreviewModal from "@/components/ParkPreviewModal";
import FilterBar, { type Filters } from "@/components/FilterBar";
import type { Park } from "@/types";

export default function HomePage() {
  const { parks, loading } = useParks();
  const { getStatus } = useStatuses();
  const [selected, setSelected] = useState<Park | null>(null);
  const [filters, setFilters] = useState<Filters>({ search: "", state: "", status: "all" });

  const states = useMemo(() => {
    const s = new Set<string>();
    parks.forEach((p) => p.states.split(",").forEach((x) => s.add(x.trim())));
    return Array.from(s).sort();
  }, [parks]);

  const filteredParks = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return parks.filter((p) => {
      if (q && !p.fullName.toLowerCase().includes(q)) return false;
      if (filters.state && !p.states.split(",").map((s) => s.trim()).includes(filters.state)) return false;
      if (filters.status !== "all" && getStatus(p.parkCode) !== filters.status) return false;
      return true;
    });
  }, [parks, filters, getStatus]);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <aside className="w-80 flex flex-col border-r border-bark-100 dark:border-forest-800 bg-white dark:bg-forest-900">
        <FilterBar filters={filters} setFilters={setFilters} states={states} total={filteredParks.length} />
        <div className="flex-1 overflow-hidden">
          <ParkSidebar parks={filteredParks} statusOf={getStatus} onSelect={setSelected} loading={loading} />
        </div>
        <Legend />
      </aside>
      <div className="flex-1 relative">
        <ParkMapWrapper parks={filteredParks} statusOf={getStatus} onSelect={setSelected} />
      </div>
      {selected && (
        <ParkPreviewModal park={selected} status={getStatus(selected.parkCode)} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="border-t border-bark-100 dark:border-forest-800 px-4 py-2.5 text-xs text-bark-600 dark:text-forest-300 flex items-center gap-3 flex-wrap">
      <Dot color="#3f7345" /> Visited
      <Dot color="#3b7bd0" /> Planned
      <Dot color="#d4a437" /> Wishlist
      <Dot color="#8b8378" /> Not visited
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span style={{ background: color }} className="inline-block w-2.5 h-2.5 rounded-full" />
    </span>
  );
}
