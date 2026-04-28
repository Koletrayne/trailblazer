"use client";

import { useState } from "react";
import Link from "next/link";
import { useTrips } from "@/hooks/useTrips";
import { useParks } from "@/hooks/useParks";

export default function TripsPage() {
  const { trips, createTrip, deleteTrip } = useTrips();
  const { parks } = useParks();
  const [name, setName] = useState("");
  const [startLocation, setStartLocation] = useState("");

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const t = createTrip({ name: name.trim(), startLocation: startLocation.trim() });
    setName("");
    setStartLocation("");
    window.location.href = `/trips/${t.id}`;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="font-display font-bold text-3xl text-forest-800 dark:text-forest-100">Trips</h1>
      <p className="text-bark-500 dark:text-forest-300 mt-1">Plan multi-park road trips, build a gear list, and estimate cost.</p>

      <form onSubmit={onCreate} className="mt-6 rounded-xl bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 p-5 shadow-soft grid sm:grid-cols-[1fr_1fr_auto] gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Trip name (e.g. Utah Mighty 5)"
          className="px-3 py-2 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
          required
        />
        <input
          type="text"
          value={startLocation}
          onChange={(e) => setStartLocation(e.target.value)}
          placeholder="Start city (e.g. Las Vegas, NV)"
          className="px-3 py-2 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
        />
        <button
          type="submit"
          className="bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold px-5 py-2 rounded-full"
        >
          Create trip
        </button>
      </form>

      <div className="mt-8">
        {trips.length === 0 ? (
          <div className="text-center py-16 text-bark-500 dark:text-forest-300">
            <div className="text-5xl mb-2">🗺</div>
            No trips yet. Create one above to start planning.
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4">
            {trips.map((t) => (
              <li key={t.id} className="rounded-xl bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/trips/${t.id}`} className="font-display text-lg font-bold text-forest-800 dark:text-forest-100 hover:underline">
                    {t.name}
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`Delete trip "${t.name}"?`)) deleteTrip(t.id);
                    }}
                    className="text-bark-400 hover:text-red-600 text-sm"
                    title="Delete trip"
                  >
                    🗑
                  </button>
                </div>
                <div className="text-xs text-bark-500 dark:text-forest-300 mt-0.5">
                  {t.startLocation || "No start city set"}
                </div>
                <div className="mt-3 text-sm text-bark-700 dark:text-forest-200">
                  {t.parkCodes.length} {t.parkCodes.length === 1 ? "park" : "parks"} · {t.style} · {t.travelers} traveler{t.travelers === 1 ? "" : "s"}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.parkCodes.slice(0, 4).map((c) => {
                    const p = parks.find((x) => x.parkCode === c);
                    return (
                      <span key={c} className="text-[11px] bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-200 px-1.5 py-0.5 rounded">
                        {p?.name ?? c}
                      </span>
                    );
                  })}
                  {t.parkCodes.length > 4 && (
                    <span className="text-[11px] text-bark-500 dark:text-forest-300">+{t.parkCodes.length - 4} more</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
