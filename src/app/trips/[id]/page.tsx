"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTrips } from "@/hooks/useTrips";
import { useParks } from "@/hooks/useParks";
import { useStatuses } from "@/hooks/useStatuses";
import TripStopList from "@/components/TripStopList";
import TripRouteMapWrapper from "@/components/TripRouteMapWrapper";
import GearChecklist from "@/components/GearChecklist";
import { generateGearChecklist } from "@/lib/gearRules";
import { estimateTripCost, type CostOverrides } from "@/lib/tripCost";
import { currentSeason, seasonForMonth } from "@/lib/seasonRules";
import type { TripStyle } from "@/types";

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { trips, getTrip, updateTrip, reorderStops, setGear, setStyle, deleteTrip } = useTrips();
  const { parks, loading } = useParks();
  const { setStatus } = useStatuses();
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerState, setPickerState] = useState("");
  const [mpg, setMpg] = useState(24);
  const [gasPerGallon, setGasPerGallon] = useState(3.6);

  const trip = getTrip(id);

  const orderedParks = useMemo(() => {
    if (!trip) return [];
    return trip.parkCodes
      .map((c) => parks.find((p) => p.parkCode === c))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [trip, parks]);

  const totalMiles = useMemo(() => {
    if (orderedParks.length < 2) return 0;
    let m = 0;
    for (let i = 0; i < orderedParks.length - 1; i++) {
      const a = orderedParks[i];
      const b = orderedParks[i + 1];
      const lat1 = a.latitude, lon1 = a.longitude, lat2 = b.latitude, lon2 = b.longitude;
      const R = 3958.8;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      m += 2 * R * Math.asin(Math.sqrt(h)) * 1.25;
    }
    return Math.round(m);
  }, [orderedParks]);

  const cost = useMemo(() => {
    if (!trip) return null;
    return estimateTripCost(
      trip,
      parks.map((p) => ({ parkCode: p.parkCode, latitude: p.latitude, longitude: p.longitude })),
      null,
      { mpg, gasPerGallon }
    );
  }, [trip, parks, mpg, gasPerGallon]);

  if (loading || trips.length === 0 && !trip) {
    return <div className="p-8 text-bark-500 dark:text-forest-300">Loading…</div>;
  }

  if (!trip) {
    return (
      <div className="p-8">
        <div className="text-bark-500 dark:text-forest-300">Trip not found.</div>
        <Link href="/trips" className="text-forest-600 dark:text-forest-300 hover:underline">← Back to trips</Link>
      </div>
    );
  }

  function regenerateGear() {
    if (!trip) return;
    const seasonGuess = trip.startDate
      ? seasonForMonth(new Date(trip.startDate).getMonth() + 1)
      : currentSeason();
    const gear = generateGearChecklist({
      parkCodes: trip.parkCodes,
      season: seasonGuess,
      style: trip.style,
      activities: ["Hiking"],
      travelers: trip.travelers
    });
    setGear(trip.id, gear);
  }

  function googleMapsUrl(): string {
    if (orderedParks.length === 0) return "https://www.google.com/maps";
    const origin = encodeURIComponent(trip!.startLocation || `${orderedParks[0].latitude},${orderedParks[0].longitude}`);
    const dest = orderedParks[orderedParks.length - 1];
    const destination = `${dest.latitude},${dest.longitude}`;
    const waypoints = orderedParks
      .slice(0, -1)
      .map((p) => `${p.latitude},${p.longitude}`)
      .join("|");
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
    return url;
  }

  function markAllPlanned() {
    if (!trip) return;
    for (const code of trip.parkCodes) setStatus(code, "planned");
  }

  const availableStates = Array.from(
    new Set(
      parks
        .filter((p) => !trip.parkCodes.includes(p.parkCode))
        .flatMap((p) => p.states.split(",").map((s) => s.trim()))
    )
  ).sort();

  const matching = parks
    .filter((p) => !trip.parkCodes.includes(p.parkCode))
    .filter((p) => pickerQuery === "" || p.fullName.toLowerCase().includes(pickerQuery.toLowerCase()))
    .filter((p) => pickerState === "" || p.states.split(",").map((s) => s.trim()).includes(pickerState))
    .slice(0, 12);

  const pickerActive = pickerQuery !== "" || pickerState !== "";

  function clearPicker() {
    setPickerQuery("");
    setPickerState("");
  }

  function updateStopNights(parkCode: string, nights: number) {
    if (!trip) return;
    const newStops = trip.routeStops.map((s) =>
      s.parkCode === parkCode ? { ...s, nights } : s
    );
    updateTrip(trip.id, { routeStops: newStops });
  }

  function addPark(code: string) {
    if (!trip) return;
    if (trip.parkCodes.includes(code)) return;
    updateTrip(trip.id, {
      parkCodes: [...trip.parkCodes, code],
      routeStops: [...trip.routeStops, { parkCode: code }]
    });
    setPickerQuery("");
  }

  function removeStop(code: string) {
    if (!trip) return;
    updateTrip(trip.id, {
      parkCodes: trip.parkCodes.filter((c) => c !== code),
      routeStops: trip.routeStops.filter((s) => s.parkCode !== code)
    });
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/trips" className="text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 hover:underline">
            ← All trips
          </Link>
          <input
            type="text"
            value={trip.name}
            onChange={(e) => updateTrip(trip.id, { name: e.target.value })}
            className="font-display text-3xl font-bold text-forest-800 dark:text-forest-100 bg-transparent border-b border-transparent hover:border-bark-200 dark:hover:border-forest-700 focus:border-forest-400 focus:outline-none mt-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/trips/${trip.id}/print`}
            className="text-sm bg-cream dark:bg-forest-800 text-forest-800 dark:text-forest-100 font-semibold px-4 py-2 rounded-full border border-bark-200 dark:border-forest-700 hover:bg-bark-50 dark:hover:bg-forest-700"
          >
            🖨 Print packet
          </Link>
          <a
            href={googleMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-forest-600 hover:bg-forest-700 text-white font-semibold px-4 py-2 rounded-full"
          >
            Open in Google Maps ↗
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Field label="Start city">
          <input
            type="text"
            value={trip.startLocation}
            onChange={(e) => updateTrip(trip.id, { startLocation: e.target.value })}
            placeholder="e.g. Las Vegas, NV"
            className="w-full px-2 py-1.5 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
          />
        </Field>
        <Field label="Start date">
          <input
            type="date"
            value={trip.startDate ?? ""}
            onChange={(e) => updateTrip(trip.id, { startDate: e.target.value })}
            className="w-full px-2 py-1.5 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
          />
        </Field>
        <Field label="Trip style">
          <select
            value={trip.style}
            onChange={(e) => setStyle(trip.id, e.target.value as TripStyle)}
            className="w-full px-2 py-1.5 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
          >
            <option value="camping">Camping</option>
            <option value="hotel">Hotel</option>
            <option value="mixed">Mixed</option>
          </select>
        </Field>
        <Field label="Travelers">
          <input
            type="number"
            min={1}
            max={20}
            value={trip.travelers}
            onChange={(e) => updateTrip(trip.id, { travelers: Math.max(1, parseInt(e.target.value || "1", 10)) })}
            className="w-full px-2 py-1.5 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
          />
        </Field>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <Card title={`Route · ${orderedParks.length} stop${orderedParks.length === 1 ? "" : "s"} · ~${totalMiles} mi`}>
            <div className="mb-4 -mt-1">
              <TripRouteMapWrapper parks={orderedParks} />
            </div>

            <TripStopList
              parkCodes={trip.parkCodes}
              parks={parks}
              stops={trip.routeStops}
              onReorder={(codes) => reorderStops(trip.id, codes)}
              onRemove={removeStop}
              onNightsChange={updateStopNights}
            />

            <div className="mt-5 border-t border-bark-100 dark:border-forest-800 pt-4">
              <div className="text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 mb-2 font-semibold">Add a park</div>
              <div className="grid sm:grid-cols-[1fr_140px] gap-2">
                <input
                  type="text"
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="Search for a park…"
                  className="w-full px-3 py-2 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
                />
                <select
                  value={pickerState}
                  onChange={(e) => setPickerState(e.target.value)}
                  className="px-2 py-2 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
                >
                  <option value="">All states</option>
                  {availableStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {pickerActive && (
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-bark-500 dark:text-forest-300">
                    {matching.length} match{matching.length === 1 ? "" : "es"}
                    {pickerState && <span> in {pickerState}</span>}
                  </div>
                  <button
                    onClick={clearPicker}
                    className="text-xs text-forest-600 dark:text-forest-300 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}
              {pickerActive && (
                <ul className="mt-2 max-h-64 overflow-y-auto scroll-thin border border-bark-100 dark:border-forest-800 rounded">
                  {matching.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-bark-500 dark:text-forest-300">No matches.</li>
                  ) : (
                    matching.map((p) => (
                      <li key={p.parkCode}>
                        <button
                          onClick={() => addPark(p.parkCode)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-cream dark:hover:bg-forest-800 flex items-center justify-between"
                        >
                          <span>{p.fullName}</span>
                          <span className="text-xs text-bark-500 dark:text-forest-300">{p.states}</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </Card>

          <Card title="Gear checklist">
            <div className="flex justify-between items-center mb-3 -mt-1">
              <p className="text-xs text-bark-500 dark:text-forest-300">Auto-built from parks, season, style, and hiking activity.</p>
              <button
                onClick={regenerateGear}
                className="text-xs bg-forest-100 dark:bg-forest-800 text-forest-800 dark:text-forest-100 px-3 py-1 rounded-full hover:bg-forest-200 dark:hover:bg-forest-700"
              >
                {trip.gearChecklist.length === 0 ? "Generate" : "Regenerate"}
              </button>
            </div>
            <GearChecklist
              items={trip.gearChecklist}
              onChange={(next) => setGear(trip.id, next)}
            />
          </Card>

          <Card title="Notes">
            <textarea
              value={trip.notes ?? ""}
              onChange={(e) => updateTrip(trip.id, { notes: e.target.value })}
              rows={5}
              placeholder="Reservations, permits, must-do hikes, who's driving when…"
              className="w-full px-3 py-2 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
            />
          </Card>
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
                <CostRow label={trip.style === "hotel" ? "🏨 Lodging" : trip.style === "mixed" ? "🏕 Lodging" : "🏕 Campgrounds"} value={cost.campgrounds} />
                <CostRow label="🎟 Entrance fees" value={cost.entranceFees} />
                <CostRow label="🍽 Food" value={cost.food} />
              </ul>

              <div className="mt-4 border-t border-bark-100 dark:border-forest-800 pt-3 space-y-2">
                <div className="text-[10px] uppercase tracking-wide text-bark-500 dark:text-forest-400 font-semibold mb-2">Adjust assumptions</div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-bark-600 dark:text-forest-300 w-20 flex-shrink-0">MPG</label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    step={1}
                    value={mpg}
                    onChange={(e) => setMpg(Math.max(5, parseFloat(e.target.value) || 24))}
                    className="w-16 px-2 py-1 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-xs text-center"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-bark-600 dark:text-forest-300 w-20 flex-shrink-0">$/gallon</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.05}
                    value={gasPerGallon}
                    onChange={(e) => setGasPerGallon(Math.max(1, parseFloat(e.target.value) || 3.6))}
                    className="w-16 px-2 py-1 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-xs text-center"
                  />
                </div>
              </div>

              <div className="text-[10px] text-bark-400 dark:text-forest-400 mt-3 leading-snug italic">
                Nights per stop set in route list. Lodging: $25–$45 camp / $110–$220 hotel. $30 entrance / park. $22/person/day food.
              </div>
            </Card>
          )}

          <Card title="Quick actions">
            <div className="space-y-2">
              <button
                onClick={markAllPlanned}
                className="w-full text-sm bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 font-semibold px-3 py-2 rounded hover:bg-sky-200 dark:hover:bg-sky-900/60"
              >
                Mark all parks as “Planned”
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete trip "${trip.name}"?`)) {
                    deleteTrip(trip.id);
                    window.location.href = "/trips";
                  }
                }}
                className="w-full text-sm bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 font-semibold px-3 py-2 rounded hover:bg-red-100 dark:hover:bg-red-900/50"
              >
                Delete trip
              </button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 mb-1 font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 p-5 shadow-soft">
      <h3 className="font-display font-bold text-lg text-forest-800 dark:text-forest-100 mb-3">{title}</h3>
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
