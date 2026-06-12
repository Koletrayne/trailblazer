"use client";

import { useEffect, useState } from "react";
import type { ThingToDo } from "@/types";

const cache = new Map<string, ThingToDo[]>();

/** Fetch Hikes & Things To Do for a set of parks, cached per park code. */
export function useThingsToDo(parkCodes: string[]) {
  const [thingsByPark, setThingsByPark] = useState<Record<string, ThingToDo[]>>({});
  const [loading, setLoading] = useState(false);
  const key = Array.from(new Set(parkCodes)).sort().join(",");

  useEffect(() => {
    let mounted = true;
    const unique = key ? key.split(",") : [];

    const seeded: Record<string, ThingToDo[]> = {};
    for (const c of unique) if (cache.has(c)) seeded[c] = cache.get(c)!;
    setThingsByPark(seeded);

    const missing = unique.filter((c) => !cache.has(c));
    if (missing.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      missing.map((c) =>
        fetch(`/api/parks/${c}`)
          .then((r) => r.json())
          .then((d: { thingsToDo?: ThingToDo[] }) => cache.set(c, d.thingsToDo ?? []))
          .catch(() => cache.set(c, []))
      )
    ).then(() => {
      if (!mounted) return;
      const next: Record<string, ThingToDo[]> = {};
      for (const c of unique) next[c] = cache.get(c) ?? [];
      setThingsByPark(next);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [key]);

  return { thingsByPark, loading };
}
