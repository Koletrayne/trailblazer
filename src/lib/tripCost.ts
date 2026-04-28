import type { Trip } from "@/types";
import { approximateDriveMiles } from "./distance";

type ParkCoord = { parkCode: string; latitude: number; longitude: number };

export type TripCostBreakdown = {
  gas: number;
  campgrounds: number;
  entranceFees: number;
  food: number;
  totalLow: number;
  totalHigh: number;
  miles: number;
  nights: number;
};

const ASSUMPTIONS = {
  mpg: 24,
  gasPerGallon: 3.6,
  campNightLow: 25,
  campNightHigh: 45,
  hotelNightLow: 110,
  hotelNightHigh: 220,
  entranceFeePerPark: 30,
  foodPerPersonPerDay: 22
};

export type CostOverrides = {
  mpg?: number;
  gasPerGallon?: number;
};

export function estimateTripCost(
  trip: Trip,
  parkCoords: ParkCoord[],
  startCoord?: { lat: number; lon: number } | null,
  overrides?: CostOverrides
): TripCostBreakdown {
  const ordered = trip.parkCodes
    .map((code) => parkCoords.find((p) => p.parkCode === code))
    .filter((p): p is ParkCoord => Boolean(p));

  const mpg = overrides?.mpg ?? ASSUMPTIONS.mpg;
  const gasPerGallon = overrides?.gasPerGallon ?? ASSUMPTIONS.gasPerGallon;

  let miles = 0;
  let prev: { lat: number; lon: number } | null = startCoord ?? null;
  for (const p of ordered) {
    if (prev) miles += approximateDriveMiles(prev, { lat: p.latitude, lon: p.longitude });
    prev = { lat: p.latitude, lon: p.longitude };
  }
  if (startCoord && prev) {
    miles += approximateDriveMiles(prev, startCoord);
  }

  const gas = (miles / mpg) * gasPerGallon;

  const totalNights = trip.routeStops.reduce((sum, s) => sum + (s.nights || 0), 0);
  const nights = totalNights || Math.max(ordered.length, 1);

  let lowPerNight = ASSUMPTIONS.campNightLow;
  let highPerNight = ASSUMPTIONS.campNightHigh;
  if (trip.style === "hotel") {
    lowPerNight = ASSUMPTIONS.hotelNightLow;
    highPerNight = ASSUMPTIONS.hotelNightHigh;
  } else if (trip.style === "mixed") {
    lowPerNight = (ASSUMPTIONS.campNightLow + ASSUMPTIONS.hotelNightLow) / 2;
    highPerNight = (ASSUMPTIONS.campNightHigh + ASSUMPTIONS.hotelNightHigh) / 2;
  }

  const lodgingLow = nights * lowPerNight;
  const lodgingHigh = nights * highPerNight;

  const entranceFees = ordered.length * ASSUMPTIONS.entranceFeePerPark;

  const days = nights + 1;
  const food = days * ASSUMPTIONS.foodPerPersonPerDay * Math.max(trip.travelers, 1);

  const baseLow = gas + lodgingLow + entranceFees + food;
  const baseHigh = gas + lodgingHigh + entranceFees + food;

  return {
    gas: Math.round(gas),
    campgrounds: Math.round((lodgingLow + lodgingHigh) / 2),
    entranceFees,
    food: Math.round(food),
    totalLow: Math.round(baseLow),
    totalHigh: Math.round(baseHigh),
    miles: Math.round(miles),
    nights
  };
}
