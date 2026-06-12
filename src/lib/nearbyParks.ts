import type { Park, UserParkStatus } from "@/types";
import { approximateDriveMiles, approximateDriveHours } from "./distance";
import { statusForMonth } from "./seasonRules";

export type NearbyParkSuggestion = {
  park: Park;
  miles: number;
  hours: number;
  inPeakSeason: boolean;
  notVisited: boolean;
};

/**
 * Suggest parks within `maxHours` drive of an anchor park, ranked by how
 * worthwhile the detour is: peak-season parks you haven't visited rank highest,
 * ties broken by proximity. Anything already in the trip is excluded.
 */
export function suggestNearbyParks(
  anchor: Park,
  allParks: Park[],
  excludedCodes: string[],
  statuses: UserParkStatus[],
  month: number,
  maxHours = 2,
  limit = 3
): NearbyParkSuggestion[] {
  const excluded = new Set(excludedCodes);
  const visited = new Set(
    statuses.filter((s) => s.status === "visited").map((s) => s.parkCode)
  );

  const candidates: NearbyParkSuggestion[] = [];

  for (const park of allParks) {
    if (park.parkCode === anchor.parkCode || excluded.has(park.parkCode)) continue;
    if (Number.isNaN(park.latitude) || Number.isNaN(park.longitude)) continue;

    const miles = approximateDriveMiles(
      { lat: anchor.latitude, lon: anchor.longitude },
      { lat: park.latitude, lon: park.longitude }
    );
    const hours = approximateDriveHours(miles);
    if (hours > maxHours) continue;

    candidates.push({
      park,
      miles,
      hours,
      inPeakSeason: statusForMonth(park.parkCode, month) === "best",
      notVisited: !visited.has(park.parkCode)
    });
  }

  candidates.sort((a, b) => {
    const score = (s: NearbyParkSuggestion) => (s.inPeakSeason ? 2 : 0) + (s.notVisited ? 1 : 0);
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return a.miles - b.miles;
  });

  return candidates.slice(0, limit);
}
