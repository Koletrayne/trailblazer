"use client";

import { useState, useEffect } from "react";

export type Coord = { lat: number; lon: number };

export function useGeocode(query: string): Coord | null {
  const [coord, setCoord] = useState<Coord | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setCoord(null); return; }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        if (data[0]) {
          setCoord({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
        } else {
          setCoord(null);
        }
      } catch {
        setCoord(null);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query]);

  return coord;
}
