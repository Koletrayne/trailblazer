import type { Park, ThingToDo, Campground, Alert, ParkImage } from "@/types";
import seedParks from "@/data/parks-seed.json";

const BASE = "https://developer.nps.gov/api/v1";

// Cache full data for a day; the NPS API has a 1000 req/hour limit per key.
const REVALIDATE_SECONDS = 60 * 60 * 24;

type NpsListResponse<T> = {
  total?: string | number;
  data?: T[];
};

function getKey(): string {
  const key = process.env.NPS_API_KEY;
  if (!key) {
    console.warn("NPS_API_KEY is missing; falling back to seed parks data.");
    return "";
  }
  return key;
}

async function npsFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<NpsListResponse<T>> {
  const key = getKey();
  if (!key) return { data: [] };
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": key, accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS }
  });
  if (!res.ok) {
    console.error(`NPS fetch failed: ${path} -> ${res.status}`);
    return { data: [] };
  }
  return (await res.json()) as NpsListResponse<T>;
}

// Authoritative list of all 63 US National Park codes.
// Using a code-based allowlist avoids NPS API designation mismatches
// (e.g. Redwood is returned as "National and State Parks", not "National Park").
const NATIONAL_PARK_CODES = new Set([
  "acad", "arch", "badl", "bibe", "bisc", "blca", "brca", "cany", "care", "cave",
  "chis", "cong", "crla", "cuva", "deva", "dena", "drto", "ever", "gaar", "jeff",
  "glac", "glba", "grca", "grte", "grba", "grsa", "grsm", "gumo", "hale", "havo",
  "hosp", "indu", "isro", "jotr", "katm", "kefj", "kica", "kova", "lacl", "lavo",
  "maca", "meve", "mora", "neri", "noca", "olym", "pefo", "pinn", "redw", "romo",
  "sagu", "seki", "shen", "thro", "viis", "voya", "whsa", "wica", "wrst", "yell",
  "yose", "zion", "npsa"
]);

function isNationalPark(parkCode: string, designation: string): boolean {
  return NATIONAL_PARK_CODES.has(parkCode) ||
    designation === "National Park" ||
    designation.includes("National Park");
}

type RawPark = {
  id: string;
  parkCode: string;
  fullName: string;
  name: string;
  designation: string;
  states: string;
  latitude: string;
  longitude: string;
  description: string;
  url: string;
  weatherInfo?: string;
  directionsInfo?: string;
  images?: ParkImage[];
  activities?: { id: string; name: string }[];
  entranceFees?: { cost: string; description: string; title: string }[];
  operatingHours?: { name: string; description: string; standardHours: Record<string, string> }[];
};

function normalizePark(p: RawPark): Park {
  return {
    id: p.id,
    parkCode: p.parkCode,
    fullName: p.fullName,
    name: p.name,
    designation: p.designation,
    states: p.states,
    latitude: parseFloat(p.latitude),
    longitude: parseFloat(p.longitude),
    description: p.description,
    url: p.url,
    weatherInfo: p.weatherInfo,
    directionsInfo: p.directionsInfo,
    images: (p.images || []).slice(0, 8),
    activities: p.activities || [],
    entranceFees: p.entranceFees,
    operatingHours: p.operatingHours
  };
}

function parksFromSeed(): Park[] {
  return (seedParks as Array<{
    parkCode: string;
    fullName: string;
    states: string;
    latitude: number;
    longitude: number;
    designation: string;
  }>).map((p) => ({
    id: p.parkCode,
    parkCode: p.parkCode,
    fullName: p.fullName,
    name: p.fullName.replace(/ National Park.*$/i, ""),
    designation: p.designation,
    states: p.states,
    latitude: p.latitude,
    longitude: p.longitude,
    description: "Detailed park information will load once the NPS API is reachable.",
    url: `https://www.nps.gov/${p.parkCode}/`,
    images: [],
    activities: []
  }));
}

/** Fetch every National Park (filtered from the full ~470 NPS units). */
export async function getAllParks(): Promise<Park[]> {
  const collected: Park[] = [];
  let start = 0;
  const pageSize = 100;
  // Loop pages until we run out
  while (true) {
    const res = await npsFetch<RawPark>("/parks", { limit: pageSize, start });
    const batch = res.data ?? [];
    if (batch.length === 0) break;
    for (const p of batch) {
      if (isNationalPark(p.parkCode, p.designation)) collected.push(normalizePark(p));
    }
    if (batch.length < pageSize) break;
    start += pageSize;
    if (start > 800) break;
  }
  if (collected.length === 0) {
    return parksFromSeed();
  }
  // Supplement with any National Park codes the NPS API didn't return.
  // (e.g. Kings Canyon `kica` is bundled into Sequoia `seki` in the API.)
  const collectedCodes = new Set(collected.map((p) => p.parkCode));
  const seed = parksFromSeed();
  for (const seedPark of seed) {
    if (NATIONAL_PARK_CODES.has(seedPark.parkCode) && !collectedCodes.has(seedPark.parkCode)) {
      collected.push(seedPark);
    }
  }
  return collected.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

/** Fetch every National Monument from the NPS API. */
export async function getAllMonuments(): Promise<Park[]> {
  const collected: Park[] = [];
  let start = 0;
  const pageSize = 100;
  while (true) {
    const res = await npsFetch<RawPark>("/parks", { limit: pageSize, start });
    const batch = res.data ?? [];
    if (batch.length === 0) break;
    for (const p of batch) {
      if (p.designation && p.designation.includes("National Monument")) {
        collected.push(normalizePark(p));
      }
    }
    if (batch.length < pageSize) break;
    start += pageSize;
    if (start > 800) break;
  }
  return collected.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function getPark(parkCode: string): Promise<Park | null> {
  const res = await npsFetch<RawPark>("/parks", { parkCode, limit: 1 });
  const raw = res.data?.[0];
  if (raw) return normalizePark(raw);
  // fallback to seed
  const seed = parksFromSeed().find((p) => p.parkCode === parkCode);
  return seed ?? null;
}

export async function getThingsToDo(parkCode: string): Promise<ThingToDo[]> {
  type RawThing = {
    id: string;
    title: string;
    shortDescription?: string;
    longDescription?: string;
    url?: string;
    activities?: { id: string; name: string }[];
    duration?: string;
    durationDescription?: string;
    difficulty?: string;
    images?: { url: string }[];
  };
  const res = await npsFetch<RawThing>("/thingstodo", { parkCode, limit: 50 });
  return (res.data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    shortDescription: t.shortDescription || t.longDescription?.slice(0, 220),
    url: t.url,
    activities: t.activities || [],
    duration: t.durationDescription || t.duration,
    difficulty: t.difficulty,
    imageUrl: t.images?.[0]?.url
  }));
}

export async function getCampgrounds(parkCode: string): Promise<Campground[]> {
  type RawCG = {
    id: string;
    name: string;
    description: string;
    url?: string;
    reservationUrl?: string;
    reservationInfo?: string;
    numberOfSitesReservable?: string;
    numberOfSitesFirstComeFirstServe?: string;
    fees?: { cost: string; description: string; title: string }[];
    amenities?: Record<string, string | string[]>;
    images?: { url: string }[];
  };
  const res = await npsFetch<RawCG>("/campgrounds", { parkCode, limit: 50 });
  return (res.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    url: c.url,
    reservationUrl: c.reservationUrl,
    reservationInfo: c.reservationInfo,
    numberOfSitesReservable: c.numberOfSitesReservable,
    numberOfSitesFirstComeFirstServe: c.numberOfSitesFirstComeFirstServe,
    fees: c.fees,
    amenities: c.amenities,
    imageUrl: c.images?.[0]?.url
  }));
  // TODO: enrich with Recreation.gov / RIDB campsite data via /api/v1/facilities for live availability.
  // RIDB requires its own API key; see https://ridb.recreation.gov/docs.
}

export async function getAlerts(parkCode: string): Promise<Alert[]> {
  type RawAlert = {
    id: string;
    title: string;
    description: string;
    category: string;
    url?: string;
  };
  const res = await npsFetch<RawAlert>("/alerts", { parkCode, limit: 30 });
  return (res.data ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    category: a.category,
    url: a.url
  }));
}
