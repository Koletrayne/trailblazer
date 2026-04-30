"use client";

import { useMemo, useState } from "react";
import { useParks } from "@/hooks/useParks";
import { useMonuments } from "@/hooks/useMonuments";
import { useStatuses } from "@/hooks/useStatuses";
import ParkMapWrapper from "@/components/ParkMapWrapper";
import ParkSidebar from "@/components/ParkSidebar";
import ParkPreviewModal from "@/components/ParkPreviewModal";
import MonumentModal from "@/components/MonumentModal";
import FilterBar, { type Filters } from "@/components/FilterBar";
import type { Park } from "@/types";

export default function HomePage() {
  const { parks, loading } = useParks();
  const { getStatus } = useStatuses();
  const [selected, setSelected] = useState<Park | null>(null);
  const [selectedMonument, setSelectedMonument] = useState<Park | null>(null);
  const [filters, setFilters] = useState<Filters>({ search: "", state: "", status: "all" });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showMonuments, setShowMonuments] = useState(false);
  const { monuments } = useMonuments(showMonuments);

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
    <div className="flex h-[calc(100vh-64px)] relative">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-80 flex-col border-r border-bark-100 dark:border-forest-800 bg-white dark:bg-forest-900">
        <FilterBar filters={filters} setFilters={setFilters} states={states} total={filteredParks.length} />
        <div className="flex-1 overflow-hidden">
          <ParkSidebar parks={filteredParks} statusOf={getStatus} onSelect={setSelected} loading={loading} />
        </div>
        <Legend />
      </aside>

      {/* Map — full width on mobile */}
      <div className="flex-1 relative">
        <ParkMapWrapper
          parks={filteredParks}
          statusOf={getStatus}
          onSelect={setSelected}
          monuments={showMonuments ? monuments : []}
          onSelectMonument={setSelectedMonument}
        />

        {/* Monument toggle — top right of map */}
        <button
          onClick={() => setShowMonuments((o) => !o)}
          className={`absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold shadow-md border transition-colors ${
            showMonuments
              ? "bg-amber-600 text-white border-amber-700"
              : "bg-white dark:bg-forest-800 text-bark-700 dark:text-forest-100 border-bark-200 dark:border-forest-700 hover:bg-cream dark:hover:bg-forest-700"
          }`}
          aria-pressed={showMonuments}
        >
          <span>🏛</span>
          <span>{showMonuments ? `Monuments (${monuments.length})` : "Show Monuments"}</span>
        </button>

        {/* Floating button to open parks list on mobile */}
        <button
          onClick={() => setSheetOpen(true)}
          className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-forest-800 text-white px-5 py-2.5 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Parks List ({filteredParks.length})
        </button>
      </div>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-[2000] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="relative bg-white dark:bg-forest-900 rounded-t-2xl flex flex-col" style={{ height: "72vh" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-bark-100 dark:border-forest-800">
              <span className="text-sm font-semibold text-forest-800 dark:text-forest-100">National Parks</span>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-bark-500 dark:text-forest-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FilterBar filters={filters} setFilters={setFilters} states={states} total={filteredParks.length} />
            <div className="flex-1 overflow-hidden">
              <ParkSidebar
                parks={filteredParks}
                statusOf={getStatus}
                onSelect={(p) => { setSelected(p); setSheetOpen(false); }}
                loading={loading}
              />
            </div>
            <Legend />
          </div>
        </div>
      )}

      {selected && (
        <ParkPreviewModal park={selected} status={getStatus(selected.parkCode)} onClose={() => setSelected(null)} />
      )}

      {selectedMonument && (
        <MonumentModal monument={selectedMonument} onClose={() => setSelectedMonument(null)} />
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
      <span className="inline-flex items-center gap-1">
        <span style={{ background: "#c9762e", border: "1.5px solid white", borderRadius: "2px", transform: "rotate(45deg)" }} className="inline-block w-2 h-2" />
        Monument
      </span>
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
