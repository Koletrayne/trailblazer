import badgeData from "@/data/badges.json";
import seedParks from "@/data/parks-seed.json";
import type { Badge, UserParkStatus } from "@/types";

const allParkCodes = (seedParks as Array<{ parkCode: string }>).map((p) => p.parkCode);

const badges: Badge[] = (badgeData as Badge[]).map((b) =>
  b.id === "all63" ? { ...b, parkCodes: allParkCodes } : b
);

export function getBadges(): Badge[] {
  return badges;
}

export function isBadgeEarned(badge: Badge, statuses: UserParkStatus[]): boolean {
  if (badge.parkCodes.length === 0) return false;
  const visited = new Set(statuses.filter((s) => s.status === "visited").map((s) => s.parkCode));
  return badge.parkCodes.every((c) => visited.has(c));
}

export function badgeProgress(badge: Badge, statuses: UserParkStatus[]): { earned: number; total: number } {
  const visited = new Set(statuses.filter((s) => s.status === "visited").map((s) => s.parkCode));
  const earned = badge.parkCodes.filter((c) => visited.has(c)).length;
  return { earned, total: badge.parkCodes.length };
}
