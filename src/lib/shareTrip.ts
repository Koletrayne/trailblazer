import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { Trip } from "@/types";

/** The portable subset of a trip — everything except local-only id/createdAt. */
export type SharedTripData = Omit<Trip, "id" | "createdAt">;

export function encodeTrip(trip: Trip): string {
  const data: SharedTripData = {
    name: trip.name,
    startLocation: trip.startLocation,
    startDate: trip.startDate,
    endDate: trip.endDate,
    parkCodes: trip.parkCodes,
    routeStops: trip.routeStops,
    gearChecklist: trip.gearChecklist,
    style: trip.style,
    travelers: trip.travelers,
    notes: trip.notes,
    itinerary: trip.itinerary
  };
  return compressToEncodedURIComponent(JSON.stringify(data));
}

export function decodeTrip(encoded: string): SharedTripData | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json) as SharedTripData;
    if (!parsed || typeof parsed.name !== "string" || !Array.isArray(parsed.parkCodes)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function buildShareUrl(trip: Trip, origin: string): string {
  // lz-string's output can contain '+', which URLSearchParams would decode to a
  // space. encodeURIComponent turns it into %2B so searchParams.get() restores it.
  return `${origin}/trips/shared?d=${encodeURIComponent(encodeTrip(trip))}`;
}
