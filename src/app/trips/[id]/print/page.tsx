"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useTrips } from "@/hooks/useTrips";
import { useParks } from "@/hooks/useParks";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/gearRules";
import { approximateDriveMiles, approximateDriveHours, formatHours } from "@/lib/distance";
import { estimateTripCost } from "@/lib/tripCost";

export default function TripPrintPage() {
  const params = useParams<{ id: string }>();
  const { getTrip } = useTrips();
  const { parks } = useParks();
  const trip = getTrip(params.id);

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
      parks.map((p) => ({ parkCode: p.parkCode, latitude: p.latitude, longitude: p.longitude }))
    );
  }, [trip, parks]);

  if (!trip) {
    return (
      <div className="p-8">
        Trip not found. <Link href="/trips" className="text-forest-600 dark:text-forest-300 hover:underline">← Back</Link>
      </div>
    );
  }

  const groupedGear = new Map<string, typeof trip.gearChecklist>();
  for (const item of trip.gearChecklist) {
    if (!groupedGear.has(item.category)) groupedGear.set(item.category, []);
    groupedGear.get(item.category)!.push(item);
  }

  return (
    <div className="bg-white text-black min-h-screen">
      <div className="no-print sticky top-0 bg-cream dark:bg-forest-900 border-b border-bark-200 px-6 py-3 flex items-center justify-between">
        <Link href={`/trips/${trip.id}`} className="text-sm text-forest-700 hover:underline">
          ← Back to trip
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold px-4 py-2 rounded-full"
        >
          🖨 Print / Save as PDF
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-8">
        <div className="border-b-2 border-forest-700 pb-4 mb-6">
          <div className="text-xs uppercase tracking-widest text-forest-700 font-semibold">Trail Blazer · trip packet</div>
          <h1 className="font-display font-bold text-4xl text-forest-800 mt-1">{trip.name}</h1>
          <div className="mt-2 text-sm text-bark-700">
            {trip.startLocation && <span>From <strong>{trip.startLocation}</strong></span>}
            {trip.startDate && <span> · Starts <strong>{trip.startDate}</strong></span>}
            <span> · {trip.travelers} traveler{trip.travelers === 1 ? "" : "s"}</span>
            <span> · {trip.style}</span>
          </div>
        </div>

        <Section title="Route">
          <ol className="space-y-3">
            {orderedParks.map((p, i) => {
              const next = orderedParks[i + 1];
              const legMiles = next
                ? approximateDriveMiles(
                    { lat: p.latitude, lon: p.longitude },
                    { lat: next.latitude, lon: next.longitude }
                  )
                : 0;
              return (
                <li key={p.parkCode}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-forest-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-bark-800">{p.fullName}</div>
                      <div className="text-xs text-bark-500">{p.states} · {p.url}</div>
                    </div>
                  </div>
                  {next && (
                    <div className="ml-11 mt-1 text-xs text-bark-600 italic">
                      ↓ ~{Math.round(legMiles)} mi · {formatHours(approximateDriveHours(legMiles))} drive
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </Section>

        {cost && (
          <Section title="Estimated cost">
            <div className="text-2xl font-display font-bold text-forest-800 mb-2">
              ${cost.totalLow.toLocaleString()}–${cost.totalHigh.toLocaleString()}
            </div>
            <ul className="text-sm grid grid-cols-2 gap-2">
              <li>Gas: ${cost.gas}</li>
              <li>Lodging: ${cost.campgrounds}</li>
              <li>Entrance fees: ${cost.entranceFees}</li>
              <li>Food: ${cost.food}</li>
            </ul>
          </Section>
        )}

        {trip.gearChecklist.length > 0 && (
          <Section title="Packing list">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {CATEGORY_ORDER.map((cat) => {
                const items = groupedGear.get(cat);
                if (!items?.length) return null;
                return (
                  <div key={cat}>
                    <div className="text-xs uppercase tracking-wide text-forest-700 font-semibold mb-1">{CATEGORY_LABEL[cat]}</div>
                    <ul className="space-y-0.5 text-sm">
                      {items.map((it) => (
                        <li key={it.id} className="flex items-center gap-2">
                          <span className="w-3 h-3 border border-bark-700 rounded-sm inline-block" />
                          <span>{it.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {trip.notes && (
          <Section title="Notes">
            <p className="whitespace-pre-wrap text-sm text-bark-700">{trip.notes}</p>
          </Section>
        )}

        <Section title="Reminders">
          <ul className="text-sm space-y-1 list-disc ml-5 text-bark-700">
            <li>Check NPS alerts for each park within 24 hours of arrival.</li>
            <li>Confirm campground reservations and timed-entry permits.</li>
            <li>Download offline maps for areas with no signal.</li>
            <li>Tell someone your route and check-in plan.</li>
            <li>Pack out all trash · Leave No Trace.</li>
          </ul>
        </Section>

        <div className="mt-8 pt-4 border-t border-bark-200 text-xs text-bark-500 text-center">
          Trail Blazer · Generated {new Date().toLocaleDateString()} · Park data: NPS API
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-display font-bold text-xl text-forest-800 border-b border-bark-200 pb-1 mb-3">{title}</h2>
      {children}
    </section>
  );
}
