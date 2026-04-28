"use client";

import { useEffect, useState } from "react";
import type { Park } from "@/types";

let cachedParks: Park[] | null = null;
let inflight: Promise<Park[]> | null = null;

async function fetchParks(): Promise<Park[]> {
  if (cachedParks) return cachedParks;
  if (inflight) return inflight;
  inflight = fetch("/api/parks")
    .then((r) => r.json())
    .then((d: { parks: Park[] }) => {
      cachedParks = d.parks;
      return d.parks;
    })
    .catch(() => [])
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useParks() {
  const [parks, setParks] = useState<Park[]>(cachedParks ?? []);
  const [loading, setLoading] = useState(!cachedParks);

  useEffect(() => {
    let mounted = true;
    fetchParks().then((p) => {
      if (!mounted) return;
      setParks(p);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { parks, loading };
}
