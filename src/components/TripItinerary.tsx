"use client";

import { useState } from "react";
import type { Park, Trip, ThingToDo } from "@/types";
import { useTrips } from "@/hooks/useTrips";
import { useThingsToDo } from "@/hooks/useThingsToDo";
import { buildDaySchedule, formatDayDate } from "@/lib/itinerary";

function newItemId() {
  return `it-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function TripItinerary({ trip, parks }: { trip: Trip; parks: Park[] }) {
  const { addItineraryItem, removeItineraryItem } = useTrips();
  const { thingsByPark, loading } = useThingsToDo(trip.parkCodes);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [customText, setCustomText] = useState("");

  const schedule = buildDaySchedule(trip);

  if (schedule.length === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 p-8 text-center shadow-soft">
        <p className="text-bark-500 dark:text-forest-300">
          Add parks to your route on the <span className="font-semibold">Planner</span> tab to build a day-by-day itinerary.
        </p>
      </div>
    );
  }

  function parkName(code: string): string {
    const p = parks.find((x) => x.parkCode === code);
    return p?.name || p?.fullName || code;
  }

  function thingFor(parkCode: string, thingId?: string): ThingToDo | undefined {
    if (!thingId) return undefined;
    return (thingsByPark[parkCode] ?? []).find((t) => t.id === thingId);
  }

  function addThing(day: number, parkCode: string, thing: ThingToDo) {
    addItineraryItem(trip.id, {
      id: newItemId(),
      day,
      parkCode,
      thingId: thing.id,
      title: thing.title
    });
  }

  function addCustom(day: number, parkCode: string) {
    const text = customText.trim();
    if (!text) return;
    addItineraryItem(trip.id, { id: newItemId(), day, parkCode, title: text });
    setCustomText("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-forest-50 dark:bg-forest-900/50 border border-forest-100 dark:border-forest-800 px-4 py-3">
        <p className="text-sm text-forest-800 dark:text-forest-200">
          <span className="font-semibold">{schedule.length}-day plan.</span>{" "}
          Days come from the nights you set per stop on the Planner tab. Add hikes and activities from each park&apos;s Things To Do.
        </p>
      </div>

      {schedule.map((day) => {
        const items = (trip.itinerary ?? []).filter((i) => i.day === day.dayNumber);
        const dateLabel = formatDayDate(day.date);
        const things = thingsByPark[day.parkCode] ?? [];
        const isOpen = openDay === day.dayNumber;
        const filtered = search.trim()
          ? things.filter((t) => t.title.toLowerCase().includes(search.trim().toLowerCase()))
          : things;

        return (
          <div
            key={day.dayNumber}
            className="rounded-xl bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 p-4 shadow-soft"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-forest-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {day.dayNumber}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-display font-bold text-bark-800 dark:text-forest-100">Day {day.dayNumber}</span>
                  {dateLabel && <span className="text-sm text-bark-500 dark:text-forest-300">{dateLabel}</span>}
                  {day.isTravelDay && (
                    <span className="text-[10px] uppercase tracking-wide bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-semibold">
                      Travel day
                    </span>
                  )}
                </div>
                <div className="text-xs text-bark-500 dark:text-forest-300">{parkName(day.parkCode)}</div>
              </div>
            </div>

            {items.length > 0 && (
              <ul className="mt-3 ml-12 space-y-1.5">
                {items.map((item) => {
                  const thing = thingFor(item.parkCode, item.thingId);
                  return (
                    <li key={item.id} className="flex items-start gap-2 group">
                      <span className="text-forest-500 mt-1 flex-shrink-0">·</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-bark-800 dark:text-forest-100">{item.title}</span>
                        {thing && (thing.duration || thing.difficulty) && (
                          <span className="text-xs text-bark-400 dark:text-forest-500 ml-2">
                            {[thing.duration, thing.difficulty].filter(Boolean).join(" · ")}
                          </span>
                        )}
                        {!item.thingId && (
                          <span className="text-[10px] uppercase tracking-wide text-bark-400 dark:text-forest-500 ml-2">custom</span>
                        )}
                      </div>
                      <button
                        onClick={() => removeItineraryItem(trip.id, item.id)}
                        className="text-bark-300 dark:text-forest-600 hover:text-red-500 text-sm flex-shrink-0"
                        aria-label="Remove activity"
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-3 ml-12">
              {!isOpen ? (
                <button
                  onClick={() => { setOpenDay(day.dayNumber); setSearch(""); setCustomText(""); }}
                  className="text-xs font-semibold text-forest-600 dark:text-forest-300 hover:underline"
                >
                  + Add activity
                </button>
              ) : (
                <div className="rounded-lg border border-bark-100 dark:border-forest-700 bg-cream/60 dark:bg-forest-800/40 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide font-semibold text-bark-500 dark:text-forest-300">
                      Things to do · {parkName(day.parkCode)}
                    </span>
                    <button
                      onClick={() => setOpenDay(null)}
                      className="text-xs text-bark-500 dark:text-forest-400 hover:underline"
                    >
                      Done
                    </button>
                  </div>

                  {loading && things.length === 0 ? (
                    <p className="text-xs text-bark-500 dark:text-forest-300">Loading activities…</p>
                  ) : things.length === 0 ? (
                    <p className="text-xs text-bark-500 dark:text-forest-300">
                      NPS returned no Things To Do for this park. Add a custom activity below.
                    </p>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search hikes & activities…"
                        className="w-full px-2 py-1.5 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-900 text-sm"
                      />
                      <ul className="max-h-56 overflow-y-auto scroll-thin divide-y divide-bark-100 dark:divide-forest-800 rounded border border-bark-100 dark:border-forest-800">
                        {filtered.length === 0 ? (
                          <li className="px-2 py-2 text-xs text-bark-500 dark:text-forest-300">No matches.</li>
                        ) : (
                          filtered.slice(0, 40).map((t) => (
                            <li key={t.id}>
                              <button
                                onClick={() => addThing(day.dayNumber, day.parkCode, t)}
                                className="w-full text-left px-2 py-2 hover:bg-forest-50 dark:hover:bg-forest-800 flex items-start justify-between gap-2"
                              >
                                <span className="min-w-0">
                                  <span className="text-sm text-bark-800 dark:text-forest-100 block truncate">{t.title}</span>
                                  {(t.duration || t.difficulty) && (
                                    <span className="text-xs text-bark-400 dark:text-forest-500">
                                      {[t.duration, t.difficulty].filter(Boolean).join(" · ")}
                                    </span>
                                  )}
                                </span>
                                <span className="text-forest-600 dark:text-forest-300 text-xs flex-shrink-0 mt-0.5">+ add</span>
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addCustom(day.dayNumber, day.parkCode); }}
                      placeholder="Or add your own (e.g. Sunset at Glacier Point)"
                      className="flex-1 px-2 py-1.5 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-900 text-sm"
                    />
                    <button
                      onClick={() => addCustom(day.dayNumber, day.parkCode)}
                      className="text-xs bg-forest-600 hover:bg-forest-700 text-white font-semibold px-3 rounded-full"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
