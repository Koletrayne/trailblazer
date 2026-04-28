import constellationsData from "@/data/constellations.json";

export type Constellation = {
  id: string;
  name: string;
  englishName: string;
  bestMonths: number[];
  minLat: number;
  maxLat: number;
  direction: string;
  description: string;
  features: string[];
  icon: string;
};

const constellations = constellationsData as Constellation[];

const DARK_SKY_PARKS = new Set([
  "nabr", // Natural Bridges NM — first IDA certified dark sky park
  "care", // Capitol Reef
  "cany", // Canyonlands — Gold Tier
  "arch", // Arches
  "brca", // Bryce Canyon — Gold Tier
  "grca", // Grand Canyon
  "grba", // Great Basin
  "bibe", // Big Bend
  "deva", // Death Valley
  "sagu", // Saguaro
  "thro", // Theodore Roosevelt
  "chcu", // Chaco Culture
  "hove", // Hovenweep
  "flfo", // Florissant Fossil Beds
  "dino", // Dinosaur NM
  "blca", // Black Canyon of the Gunnison
  "josh", // Joshua Tree
  "zion", // Zion
  "glac", // Glacier
  "grsa", // Great Sand Dunes
  "pefo", // Petrified Forest
]);

function monthDist(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 12 - diff);
}

export function getVisibleConstellations(
  latitude: number,
  month: number
): { peak: Constellation[]; visible: Constellation[] } {
  const atLatitude = constellations.filter(
    (c) => latitude >= c.minLat && latitude <= c.maxLat
  );

  const peak = atLatitude.filter((c) => c.bestMonths.includes(month));

  const visible = atLatitude.filter(
    (c) =>
      !c.bestMonths.includes(month) &&
      c.bestMonths.some((m) => monthDist(m, month) <= 2)
  );

  return { peak, visible };
}

export function isDarkSkyPark(parkCode: string): boolean {
  return DARK_SKY_PARKS.has(parkCode.toLowerCase());
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function bestViewingWindow(latitude: number): string {
  if (latitude > 60) return "May–September (long twilight; winter offers aurora chances)";
  if (latitude > 45) return "June–September for Milky Way core; Oct–Feb for winter constellations";
  if (latitude > 30) return "June–September for Milky Way core; November–February for Orion & winter sky";
  return "Year-round excellent; summer for galactic core, winter for Orion";
}
