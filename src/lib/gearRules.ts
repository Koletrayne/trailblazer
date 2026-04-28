import gear from "@/data/gear-rules.json";
import type { GearItem, GearCategory, Season, TripStyle } from "@/types";
import { getClimate } from "./seasonRules";

type GearRule = { label: string; category: GearCategory };

type RulesShape = {
  base: GearRule[];
  by_climate: Record<string, GearRule[]>;
  by_season: Record<Season, GearRule[]>;
  by_style: Record<TripStyle, GearRule[]>;
  by_activity: Record<string, GearRule[]>;
};

const g = gear as RulesShape;

let _id = 0;
const newId = () => `gear-${Date.now().toString(36)}-${(_id++).toString(36)}`;

export function generateGearChecklist(opts: {
  parkCodes: string[];
  season: Season;
  style: TripStyle;
  activities?: string[];
  travelers?: number;
}): GearItem[] {
  const items: GearRule[] = [];
  const seen = new Set<string>();
  const push = (rule: GearRule) => {
    const key = rule.label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    items.push(rule);
  };

  g.base.forEach(push);
  for (const code of opts.parkCodes) {
    const climate = getClimate(code);
    (g.by_climate[climate] || []).forEach(push);
  }
  (g.by_season[opts.season] || []).forEach(push);
  (g.by_style[opts.style] || []).forEach(push);
  for (const a of opts.activities || []) {
    (g.by_activity[a] || []).forEach(push);
  }

  return items.map((r) => ({
    id: newId(),
    label: r.label,
    category: r.category,
    checked: false
  }));
}

export const CATEGORY_ORDER: GearCategory[] = [
  "clothing",
  "safety",
  "food_water",
  "camping",
  "navigation",
  "electronics",
  "personal",
  "documents"
];

export const CATEGORY_LABEL: Record<GearCategory, string> = {
  clothing: "Clothing",
  safety: "Safety",
  food_water: "Food & Water",
  camping: "Camping",
  navigation: "Navigation",
  electronics: "Electronics",
  personal: "Personal",
  documents: "Documents"
};
