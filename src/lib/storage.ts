"use client";

import { useEffect, useState } from "react";

const STATUSES_KEY = "tb.statuses.v1";
const TRIPS_KEY = "tb.trips.v1";
const THEME_KEY = "tb.theme";
const PROFILE_KEY = "tb.profile.v1";

export type Profile = {
  homeCity?: string;
  homeLat?: number;
  homeLon?: number;
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(`tb:storage:${key}`));
  } catch {
    /* quota or denied — ignore */
  }
}

/** Reactive hook that syncs with localStorage and across tabs. */
export function useStored<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(read(key, initial));
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setValue(read(key, initial));
    };
    const onLocal = () => setValue(read(key, initial));
    window.addEventListener("storage", onStorage);
    window.addEventListener(`tb:storage:${key}`, onLocal as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(`tb:storage:${key}`, onLocal as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = (next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      if (hydrated) write(key, v);
      return v;
    });
  };

  return [value, update];
}

export const STORAGE_KEYS = {
  STATUSES: STATUSES_KEY,
  TRIPS: TRIPS_KEY,
  THEME: THEME_KEY,
  PROFILE: PROFILE_KEY
};

export function exportAllData(): string {
  if (typeof window === "undefined") return "{}";
  return JSON.stringify(
    {
      statuses: read(STATUSES_KEY, []),
      trips: read(TRIPS_KEY, []),
      profile: read(PROFILE_KEY, {})
    },
    null,
    2
  );
}

export function importAllData(json: string): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json);
    if (parsed.statuses) write(STATUSES_KEY, parsed.statuses);
    if (parsed.trips) write(TRIPS_KEY, parsed.trips);
    if (parsed.profile) write(PROFILE_KEY, parsed.profile);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
