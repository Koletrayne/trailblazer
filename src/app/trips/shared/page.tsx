"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useParks } from "@/hooks/useParks";
import { useGeocode } from "@/hooks/useGeocode";
import { useTrips } from "@/hooks/useTrips";
import TripRouteMapWrapper from "@/components/TripRouteMapWrapper";
import { decodeTrip } from "@/lib/shareTrip";
import { estimateTripCost } from "@/lib/tripCost";
import { buildDaySchedule, formatDayDate } from "@/lib/itinerary";
import { CATEGORY_ORDER, CATEGORY_LABEL } from "@/lib/gearRules";
import type { Trip } from "@/types";

export default function SharedTripPage() {
  return (
    <Suspense fallback={<div className="p-8 text-bark-500 dark:text-forest-300">Loading shared trip…</div>}>
      <SharedTripView />
    </Suspense>
  );
}

function SharedTripView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { parks, loading } = useParks();
  const { createTrip } = useTrips();

  const encoded = searchParams.get("d") ?? "";
  const data = useMemo(() => decodeTrip(encoded), [encoded]);

  // A full Trip shape for reusing the existing helpers/components.
  const trip = useMemo<Trip | null>(
    () => (data ? { id: "shared", createdAt: "", ...data } : null),
    [data]
  );

  const startCoord = useGeocode(trip?.startLocation ?? "");

  const orderedParks = useMemo(() => {
    if (!trip) return [];
    return trip.parkCodes
      .map((c) => parks.find((p) => p.parkCode === c))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [trip, parks]);

  const cost = useMemo(() => {
    if (!trip) return null;
    return estimateTripCost(
      trip,
      parks.map((p) => ({ parkCode: p.parkCode, latitude: p.latitude, longitude: p.longitude })),
      startCoord ?? null
    );
  }, [trip, parks, startCoord]);

  const schedule = useMemo(() => (trip ? buildDaySchedule(trip) : []), [trip]);
  const itinerary = trip?.itinerary ?? [];

  const groupedGear = useMemo(() => {
    const m = new Map<string, NonNullable<Trip["gearChecklist"]>>();
    for (const item of trip?.gearChecklist ?? []) {
      if (!m.has(item.category)) m.set(item.category, []);
      m.get(item.category)!.push(item);
    }
    return m;
  }, [trip]);

  function copyToMyTrips() {
    if (!data) return;
    const created = createTrip({ ...data, name: `${data.name} (copy)` });
    router.push(`/trips/${created.id}`);
  }

  if (!trip) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h1 className="font-display font-bold text-2xl text-forest-800 dark:text-forest-100">This shared link is invalid</h1>
        <p className="text-bark-500 dark:text-forest-300 mt-2">
          The trip data in this link couldn&apos;t be read. It may be incomplete or corrupted.
        </p>
        <Link href="/trips" className="inline-block mt-4 text-forest-600 dark:text-forest-300 hover:underline">
          ← Go to your trips
        </Link>
      </div>
    );
  }

  function parkName(code: string): string {
    const p = parks.find((x) => x.parkCode === code);
    return p?.name || p?.fullName || code;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-wide bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-200 px-2 py-0.5 rounded-full font-semibold">
            Shared trip
          </span>
          <h1 className="font-display font-bold text-3xl text-forest-800 dark:text-forest-100 mt-2">{trip.name}</h1>
          <div className="mt-1 text-sm text-bark-500 dark:text-forest-300">
            {trip.startLocation && <span>From {trip.startLocation}</span>}
            {trip.startDate && <span> · Starts {trip.startDate}</span>}
            <span> · {trip.travelers} traveler{trip.travelers === 1 ? "" : "s"}</span>
            <span> · {trip.style}</span>
          </div>
        </div>
        <button
          onClick={copyToMyTrips}
          className="text-sm bg-forest-600 hover:bg-forest-700 text-white font-semibold px-4 py-2 rounded-full"
        >
          Copy to my trips
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <Card title={`Route · ${orderedParks.length} stop${orderedParks.length === 1 ? "" : "s"} · ~${cost?.miles ?? 0} mi`}>
            <div className="mb-4 -mt-1">
              <TripRouteMapWrapper parks={orderedParks} startCoord={startCoord} />
            </div>
            <ol className="space-y-2">
              {orderedParks.map((p, i) => (
                <li key={p.parkCode} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-forest-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                  <div>
                    <div className="text-sm font-semibold text-bark-800 dark:text-forest-100">{p.fullName}</div>
                    <div className="text-xs text-bark-500 dark:text-forest-300">{p.states}</div>
                  </div>
                </li>
              ))}
              {orderedParks.length === 0 && !loading && (
                <li className="text-sm text-bark-500 dark:text-forest-300 italic">No parks in this trip.</li>
              )}
            </ol>
          </Card>

          {itinerary.length > 0 && (
            <Card title="Daily itinerary">
              <div className="space-y-3">
                {schedule.map((day) => {
                  const items = itinerary.filter((i) => i.day === day.dayNumber);
                  if (items.length === 0) return null;
                  const dateLabel = formatDayDate(day.date);
                  return (
                    <div key={day.dayNumber}>
                      <div className="text-sm font-semibold text-bark-800 dark:text-forest-100">
                        Day {day.dayNumber}
                        {dateLabel && <span className="font-normal text-bark-500 dark:text-forest-300"> · {dateLabel}</span>}
                        <span className="font-normal text-bark-500 dark:text-forest-300"> · {parkName(day.parkCode)}</span>
                        {day.isTravelDay && <span className="font-normal text-bark-400 dark:text-forest-500 italic"> · travel day</span>}
                      </div>
                      <ul className="ml-4 mt-1 space-y-0.5">
                        {items.map((item) => (
                          <li key={item.id} className="flex items-start gap-2 text-sm text-bark-700 dark:text-forest-200">
                            <span className="text-forest-500 mt-1 flex-shrink-0">·</span>
                            <span>{item.title}{item.note ? ` — ${item.note}` : ""}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {(trip.gearChecklist?.length ?? 0) > 0 && (
            <Card title="Packing list">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {CATEGORY_ORDER.map((cat) => {
                  const items = groupedGear.get(cat);
                  if (!items?.length) return null;
                  return (
                    <div key={cat}>
                      <div className="text-xs uppercase tracking-wide text-forest-700 dark:text-forest-300 font-semibold mb-1">{CATEGORY_LABEL[cat]}</div>
                      <ul className="space-y-0.5 text-sm">
                        {items.map((it) => (
                          <li key={it.id} className="flex items-center gap-2 text-bark-700 dark:text-forest-200">
                            <span className={`w-3 h-3 rounded-sm inline-block flex-shrink-0 ${it.checked ? "bg-forest-500" : "border border-bark-300 dark:border-forest-600"}`} />
                            <span>{it.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {trip.notes && (
            <Card title="Notes">
              <p className="whitespace-pre-wrap text-sm text-bark-700 dark:text-forest-200">{trip.notes}</p>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          {cost && (
            <Card title="Cost estimate">
              <div className="text-3xl font-display font-bold text-forest-800 dark:text-forest-100">
                ${cost.totalLow.toLocaleString()}–${cost.totalHigh.toLocaleString()}
              </div>
              <div className="text-xs text-bark-500 dark:text-forest-300 mt-0.5">
                For {trip.travelers} traveler{trip.travelers === 1 ? "" : "s"} · {cost.miles} mi · {cost.nights} night{cost.nights === 1 ? "" : "s"}
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                <CostRow label="⛽ Gas" value={cost.gas} />
                <CostRow label={trip.style === "hotel" ? "🏨 Lodging" : "🏕 Lodging"} value={cost.campgrounds} />
                <CostRow label="🎟 Entrance fees" value={cost.entranceFees} />
                <CostRow label="🍽 Food" value={cost.food} />
              </ul>
              <div className="text-[10px] text-bark-400 dark:text-forest-500 mt-3 leading-snug italic">
                Estimate based on shared trip settings. Copy to your trips to customize assumptions.
              </div>
            </Card>
          )}

          <Card title="Make it yours">
            <p className="text-sm text-bark-600 dark:text-forest-300 mb-3">
              Copy this trip to your own Trail Blazer to edit stops, gear, and the itinerary.
            </p>
            <button
              onClick={copyToMyTrips}
              className="w-full text-sm bg-forest-600 hover:bg-forest-700 text-white font-semibold px-3 py-2 rounded-full"
            >
              Copy to my trips
            </button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 p-5 shadow-soft">
      <h2 className="font-display font-bold text-lg text-forest-800 dark:text-forest-100 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex justify-between">
      <span className="text-bark-700 dark:text-forest-200">{label}</span>
      <span className="font-mono text-bark-800 dark:text-forest-100">${value.toLocaleString()}</span>
    </li>
  );
}
