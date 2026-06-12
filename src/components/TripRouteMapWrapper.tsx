"use client";

import dynamic from "next/dynamic";
import type { Park } from "@/types";
import type { Coord } from "@/hooks/useGeocode";

const TripRouteMap = dynamic(() => import("./TripRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-lg bg-cream/60 dark:bg-forest-800/40 flex items-center justify-center text-sm text-bark-500 dark:text-forest-300">
      Loading map…
    </div>
  )
});

export default function TripRouteMapWrapper({ parks, startCoord }: { parks: Park[]; startCoord?: Coord | null }) {
  if (parks.length === 0 && !startCoord) {
    return (
      <div className="h-64 w-full rounded-lg bg-cream/60 dark:bg-forest-800/40 flex items-center justify-center text-sm text-bark-500 dark:text-forest-300 italic">
        Add parks below to see your route
      </div>
    );
  }
  return <TripRouteMap parks={parks} startCoord={startCoord} />;
}
