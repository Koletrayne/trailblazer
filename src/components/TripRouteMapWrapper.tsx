"use client";

import dynamic from "next/dynamic";
import type { Park } from "@/types";

const TripRouteMap = dynamic(() => import("./TripRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-lg bg-cream/60 dark:bg-forest-800/40 flex items-center justify-center text-sm text-bark-500 dark:text-forest-300">
      Loading map…
    </div>
  )
});

export default function TripRouteMapWrapper({ parks }: { parks: Park[] }) {
  if (parks.length === 0) {
    return (
      <div className="h-64 w-full rounded-lg bg-cream/60 dark:bg-forest-800/40 flex items-center justify-center text-sm text-bark-500 dark:text-forest-300 italic">
        Add parks below to see your route
      </div>
    );
  }
  return <TripRouteMap parks={parks} />;
}
