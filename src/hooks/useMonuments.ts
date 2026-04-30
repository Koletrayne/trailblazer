"use client";

import { useEffect, useState } from "react";
import type { Park } from "@/types";

let cachedMonuments: Park[] | null = null;
let inflight: Promise<Park[]> | null = null;

async function fetchMonuments(): Promise<Park[]> {
  if (cachedMonuments) return cachedMonuments;
  if (inflight) return inflight;
  inflight = fetch("/api/monuments")
    .then((r) => r.json())
    .then((d: { monuments: Park[] }) => {
      cachedMonuments = d.monuments;
      return d.monuments;
    })
    .catch(() => [])
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useMonuments(enabled: boolean) {
  const [monuments, setMonuments] = useState<Park[]>(cachedMonuments ?? []);
  const [loading, setLoading] = useState(enabled && !cachedMonuments);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    setLoading(!cachedMonuments);
    fetchMonuments().then((m) => {
      if (!mounted) return;
      setMonuments(m);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [enabled]);

  return { monuments, loading };
}
