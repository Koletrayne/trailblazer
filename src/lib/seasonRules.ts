import rules from "@/data/season-rules.json";
import seedParks from "@/data/parks-seed.json";
import type { Season, SeasonRule } from "@/types";

type ClimateKey = SeasonRule["climate"];

type RulesShape = {
  _default_by_climate: Record<ClimateKey, {
    bestMonths: number[];
    shoulderMonths: number[];
    avoidMonths: number[];
    cautions: Partial<Record<Season, string[]>>;
  }>;
  _overrides: Record<string, Partial<{
    bestMonths: number[];
    shoulderMonths: number[];
    avoidMonths: number[];
  }>>;
};

const r = rules as RulesShape;

const climateByCode = new Map<string, ClimateKey>();
for (const p of seedParks as Array<{ parkCode: string; climate: ClimateKey }>) {
  climateByCode.set(p.parkCode, p.climate);
}

export function getClimate(parkCode: string): ClimateKey {
  return climateByCode.get(parkCode) ?? "temperate";
}

export function getSeasonRule(parkCode: string): SeasonRule {
  const climate = getClimate(parkCode);
  const base = r._default_by_climate[climate];
  const override = r._overrides[parkCode] || {};
  return {
    parkCode,
    climate,
    bestMonths: override.bestMonths ?? base.bestMonths,
    shoulderMonths: override.shoulderMonths ?? base.shoulderMonths,
    avoidMonths: override.avoidMonths ?? base.avoidMonths,
    cautions: base.cautions
  };
}

export function monthName(m: number): string {
  return ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m] || "";
}

export function seasonForMonth(m: number): Season {
  if (m === 12 || m <= 2) return "winter";
  if (m <= 5) return "spring";
  if (m <= 8) return "summer";
  return "fall";
}

export function currentSeason(date = new Date()): Season {
  return seasonForMonth(date.getMonth() + 1);
}

export type SeasonStatus = "best" | "shoulder" | "avoid" | "ok";

export function statusForMonth(parkCode: string, month: number): SeasonStatus {
  const rule = getSeasonRule(parkCode);
  if (rule.bestMonths.includes(month)) return "best";
  if (rule.avoidMonths.includes(month)) return "avoid";
  if (rule.shoulderMonths.includes(month)) return "shoulder";
  return "ok";
}
