"use client";

import { useStored, STORAGE_KEYS } from "@/lib/storage";
import type { GearItem, Trip, TripStyle, RouteStop, ItineraryItem } from "@/types";

function newId() {
  return `trip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useTrips() {
  const [trips, setTrips] = useStored<Trip[]>(STORAGE_KEYS.TRIPS, []);

  function createTrip(input: Partial<Trip> & { name: string }): Trip {
    const trip: Trip = {
      id: newId(),
      name: input.name,
      startLocation: input.startLocation ?? "",
      startDate: input.startDate,
      endDate: input.endDate,
      parkCodes: input.parkCodes ?? [],
      routeStops: input.routeStops ?? (input.parkCodes ?? []).map((c) => ({ parkCode: c })),
      gearChecklist: input.gearChecklist ?? [],
      style: input.style ?? "camping",
      travelers: input.travelers ?? 2,
      notes: input.notes,
      createdAt: new Date().toISOString()
    };
    setTrips((prev) => [trip, ...prev]);
    return trip;
  }

  function updateTrip(id: string, patch: Partial<Trip>) {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function deleteTrip(id: string) {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }

  function getTrip(id: string): Trip | undefined {
    return trips.find((t) => t.id === id);
  }

  function reorderStops(id: string, parkCodes: string[]) {
    setTrips((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const stopByCode = new Map(t.routeStops.map((s) => [s.parkCode, s]));
        const newStops: RouteStop[] = parkCodes.map((c) => stopByCode.get(c) ?? { parkCode: c });
        return { ...t, parkCodes, routeStops: newStops };
      })
    );
  }

  function setGear(id: string, gear: GearItem[]) {
    updateTrip(id, { gearChecklist: gear });
  }

  function setStyle(id: string, style: TripStyle) {
    updateTrip(id, { style });
  }

  function addItineraryItem(id: string, item: ItineraryItem) {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, itinerary: [...(t.itinerary ?? []), item] } : t))
    );
  }

  function removeItineraryItem(id: string, itemId: string) {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, itinerary: (t.itinerary ?? []).filter((x) => x.id !== itemId) } : t
      )
    );
  }

  function updateItineraryItem(id: string, itemId: string, patch: Partial<ItineraryItem>) {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, itinerary: (t.itinerary ?? []).map((x) => (x.id === itemId ? { ...x, ...patch } : x)) }
          : t
      )
    );
  }

  return {
    trips,
    createTrip,
    updateTrip,
    deleteTrip,
    getTrip,
    reorderStops,
    setGear,
    setStyle,
    addItineraryItem,
    removeItineraryItem,
    updateItineraryItem
  };
}
