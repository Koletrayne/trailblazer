"use client";

import dynamic from "next/dynamic";
import type { Park, Status } from "@/types";

// Leaflet hits `window` on import — must be SSR-disabled.
const ParkMap = dynamic(() => import("./ParkMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-bark-500 dark:text-forest-300">
      Loading map…
    </div>
  )
});

export default function ParkMapWrapper(props: {
  parks: Park[];
  statusOf: (code: string) => Status;
  onSelect: (p: Park) => void;
  monuments?: Park[];
  onSelectMonument?: (m: Park) => void;
}) {
  return <ParkMap {...props} />;
}
