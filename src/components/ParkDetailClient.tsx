"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Park, ThingToDo, Campground, Alert } from "@/types";
import StatusPicker from "./StatusPicker";
import StatusBadge from "./StatusBadge";
import { useStatuses } from "@/hooks/useStatuses";
import { useTrips } from "@/hooks/useTrips";
import { getSeasonRule, monthName, statusForMonth, currentSeason } from "@/lib/seasonRules";
import { generateGearChecklist, CATEGORY_ORDER, CATEGORY_LABEL } from "@/lib/gearRules";
import { getVisibleConstellations, isDarkSkyPark, MONTH_NAMES, bestViewingWindow } from "@/lib/stargazing";

type Tab = "overview" | "hikes" | "campgrounds" | "seasons" | "gear" | "notes" | "stargazing";

export default function ParkDetailClient({
  park,
  thingsToDo,
  campgrounds,
  alerts
}: {
  park: Park;
  thingsToDo: ThingToDo[];
  campgrounds: Campground[];
  alerts: Alert[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const { getStatus, getStatusObject, updateStatus } = useStatuses();
  const { trips, updateTrip } = useTrips();
  const status = getStatus(park.parkCode);
  const statusObj = getStatusObject(park.parkCode);

  const hero = park.images?.[0]?.url;

  function addToTrip(tripId: string) {
    const t = trips.find((x) => x.id === tripId);
    if (!t) return;
    if (t.parkCodes.includes(park.parkCode)) return;
    updateTrip(tripId, {
      parkCodes: [...t.parkCodes, park.parkCode],
      routeStops: [...t.routeStops, { parkCode: park.parkCode }]
    });
  }

  return (
    <div>
      <div className="relative h-72 md:h-96 bg-forest-900">
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt={park.fullName} className="h-full w-full object-cover opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-6 pb-6 text-white">
          <Link href="/" className="text-xs uppercase tracking-wide opacity-80 hover:underline">
            ← Back to map
          </Link>
          <h1 className="font-display font-bold text-3xl md:text-4xl mt-1">{park.fullName}</h1>
          <div className="text-sm opacity-90 mt-1">{park.designation} · {park.states}</div>
          <div className="mt-2"><StatusBadge status={status} /></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <Tabs current={tab} onChange={setTab} />
          <div className="mt-6">
            {tab === "overview" && <OverviewTab park={park} alerts={alerts} />}
            {tab === "hikes" && <HikesTab thingsToDo={thingsToDo} />}
            {tab === "campgrounds" && <CampgroundsTab campgrounds={campgrounds} />}
            {tab === "seasons" && <SeasonsTab parkCode={park.parkCode} />}
            {tab === "gear" && <GearTab parkCode={park.parkCode} />}
            {tab === "stargazing" && <StargazingTab park={park} />}
            {tab === "notes" && (
              <NotesTab
                parkCode={park.parkCode}
                visitedDate={statusObj?.visitedDate}
                rating={statusObj?.rating}
                notes={statusObj?.notes}
                onChange={(patch) => updateStatus(park.parkCode, patch)}
              />
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <Card title="My status">
            <StatusPicker parkCode={park.parkCode} />
          </Card>

          <Card title="Add to trip">
            {trips.length === 0 ? (
              <div className="text-sm text-bark-500 dark:text-forest-300">
                No trips yet.{" "}
                <Link href="/trips" className="text-forest-600 dark:text-forest-300 hover:underline">
                  Create one →
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {trips.map((t) => {
                  const inTrip = t.parkCodes.includes(park.parkCode);
                  return (
                    <button
                      key={t.id}
                      onClick={() => addToTrip(t.id)}
                      disabled={inTrip}
                      className="w-full text-left text-sm py-2 px-3 rounded-md bg-cream dark:bg-forest-800 hover:bg-forest-50 dark:hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                    >
                      <span>{t.name}</span>
                      <span className="text-xs">{inTrip ? "✓ added" : "+ add"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {alerts.length > 0 && (
            <Card title={`⚠ Alerts (${alerts.length})`}>
              <ul className="space-y-2 text-sm">
                {alerts.slice(0, 4).map((a) => (
                  <li key={a.id} className="border-l-2 border-amber-500 pl-3">
                    <div className="font-semibold text-bark-800 dark:text-forest-100">{a.title}</div>
                    <div className="text-xs text-bark-500 dark:text-forest-300">{a.category}</div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {park.url && (
            <a
              href={park.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center w-full bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold py-2.5 rounded-full"
            >
              Official park page ↗
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}

function Tabs({ current, onChange }: { current: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "hikes", label: "Hikes & Activities" },
    { id: "campgrounds", label: "Campgrounds" },
    { id: "seasons", label: "Seasons" },
    { id: "gear", label: "Gear" },
    { id: "stargazing", label: "⭐ Stargazing" },
    { id: "notes", label: "My Notes" }
  ];
  return (
    <div className="flex gap-1 border-b border-bark-100 dark:border-forest-800 overflow-x-auto scroll-thin">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
            current === t.id
              ? "border-forest-600 text-forest-700 dark:text-forest-200"
              : "border-transparent text-bark-500 dark:text-forest-300 hover:text-forest-700 dark:hover:text-forest-100"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 p-4 shadow-soft">
      <div className="text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 mb-2 font-semibold">
        {title}
      </div>
      {children}
    </div>
  );
}

function OverviewTab({ park, alerts }: { park: Park; alerts: Alert[] }) {
  return (
    <div className="space-y-6">
      <p className="text-bark-700 dark:text-forest-200 leading-relaxed">{park.description}</p>

      {park.images && park.images.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {park.images.slice(0, 6).map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.url}
              alt={img.altText || park.fullName}
              className="aspect-video object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {park.entranceFees && park.entranceFees.length > 0 && (
          <Card title="Entrance fees">
            <ul className="space-y-2 text-sm">
              {park.entranceFees.map((f, i) => (
                <li key={i}>
                  <div className="flex justify-between">
                    <span className="text-bark-700 dark:text-forest-200">{f.title}</span>
                    <span className="font-mono text-forest-700 dark:text-forest-200">${f.cost}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {park.operatingHours && park.operatingHours.length > 0 && (
          <Card title="Hours">
            {park.operatingHours.slice(0, 1).map((h, i) => (
              <div key={i}>
                <div className="font-semibold text-sm text-bark-800 dark:text-forest-100 mb-1">{h.name}</div>
                <ul className="text-xs space-y-0.5">
                  {Object.entries(h.standardHours).map(([day, hours]) => (
                    <li key={day} className="flex justify-between">
                      <span className="capitalize text-bark-500 dark:text-forest-300">{day}</span>
                      <span className="text-bark-700 dark:text-forest-200">{hours}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        )}
      </div>

      {park.weatherInfo && (
        <Card title="Weather">
          <p className="text-sm text-bark-700 dark:text-forest-200">{park.weatherInfo}</p>
        </Card>
      )}

      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display font-bold text-lg text-forest-800 dark:text-forest-100">Active alerts</h3>
          {alerts.map((a) => (
            <div
              key={a.id}
              className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-r-md"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold">
                {a.category}
              </div>
              <div className="font-semibold text-bark-800 dark:text-forest-100 mt-0.5">{a.title}</div>
              <div className="text-sm text-bark-600 dark:text-forest-300 mt-1">{a.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HikesTab({ thingsToDo }: { thingsToDo: ThingToDo[] }) {
  if (thingsToDo.length === 0) {
    return (
      <div className="text-sm text-bark-500 dark:text-forest-300">
        No activities returned by NPS for this park yet. Try the official park page for a complete list.
      </div>
    );
  }
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {thingsToDo.map((t) => (
        <a
          key={t.id}
          href={t.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl overflow-hidden bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 hover:shadow-soft transition-shadow"
        >
          {t.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.imageUrl} alt={t.title} className="h-40 w-full object-cover" />
          )}
          <div className="p-4">
            <div className="font-semibold text-bark-800 dark:text-forest-100">{t.title}</div>
            {(t.duration || t.difficulty) && (
              <div className="text-xs text-bark-500 dark:text-forest-300 mt-1 flex gap-3">
                {t.duration && <span>⏱ {t.duration}</span>}
                {t.difficulty && <span>📈 {t.difficulty}</span>}
              </div>
            )}
            {t.shortDescription && (
              <p className="text-sm text-bark-600 dark:text-forest-300 mt-2 line-clamp-3">{t.shortDescription}</p>
            )}
            {t.activities && t.activities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {t.activities.slice(0, 3).map((a) => (
                  <span key={a.id} className="text-[10px] uppercase tracking-wide bg-forest-100 dark:bg-forest-800 text-forest-700 dark:text-forest-200 px-1.5 py-0.5 rounded">
                    {a.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

function CampgroundsTab({ campgrounds }: { campgrounds: Campground[] }) {
  if (campgrounds.length === 0) {
    return (
      <div className="text-sm text-bark-500 dark:text-forest-300">
        No campgrounds returned by NPS for this park. Some parks only support backcountry permits or external lodging.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {campgrounds.map((c) => (
        <div
          key={c.id}
          className="rounded-xl bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 overflow-hidden"
        >
          {c.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.imageUrl} alt={c.name} className="h-44 w-full object-cover" />
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-bark-800 dark:text-forest-100">{c.name}</h3>
              <div className="text-xs text-bark-500 dark:text-forest-300 text-right shrink-0">
                {c.numberOfSitesReservable && <div>{c.numberOfSitesReservable} reservable</div>}
                {c.numberOfSitesFirstComeFirstServe && <div>{c.numberOfSitesFirstComeFirstServe} first-come</div>}
              </div>
            </div>
            <p className="text-sm text-bark-600 dark:text-forest-300 mt-2 line-clamp-3">{c.description}</p>
            {(c.reservationUrl || c.url) && (
              <div className="mt-3 flex gap-3 text-sm">
                {c.reservationUrl && (
                  <a href={c.reservationUrl} target="_blank" rel="noopener noreferrer" className="text-forest-600 dark:text-forest-300 hover:underline font-medium">
                    Reserve ↗
                  </a>
                )}
                {c.url && (
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-bark-500 dark:text-forest-300 hover:underline">
                    Details ↗
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      <div className="text-xs text-bark-500 dark:text-forest-300 italic">
        Reservation availability may differ from posted info — confirm via the reservation link. Data source: NPS API
        (campground enrichment via Recreation.gov / RIDB can be plugged into <code>src/lib/nps.ts</code>).
      </div>
    </div>
  );
}

function SeasonsTab({ parkCode }: { parkCode: string }) {
  const rule = getSeasonRule(parkCode);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const cur = currentSeason();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 mb-2 font-semibold">Best months to visit</div>
        <div className="grid grid-cols-12 gap-1.5">
          {months.map((m) => {
            const s = statusForMonth(parkCode, m);
            const cls = {
              best: "bg-forest-500 text-white",
              shoulder: "bg-amber-300 text-amber-900",
              avoid: "bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-100",
              ok: "bg-bark-100 dark:bg-forest-800 text-bark-700 dark:text-forest-200"
            }[s];
            return (
              <div
                key={m}
                className={`text-center py-2 rounded text-xs font-semibold ${cls}`}
                title={s}
              >
                {monthName(m)}
              </div>
            );
          })}
        </div>
        <div className="text-xs text-bark-500 dark:text-forest-300 mt-2 flex flex-wrap gap-3">
          <Legend swatch="bg-forest-500" label="Best" />
          <Legend swatch="bg-amber-300" label="Shoulder" />
          <Legend swatch="bg-red-200 dark:bg-red-900/40" label="Avoid" />
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 mb-2 font-semibold">
          Climate: <span className="text-forest-700 dark:text-forest-200">{rule.climate}</span>
        </div>
        {(["spring", "summer", "fall", "winter"] as const).map((s) => (
          <div key={s} className={`mb-3 ${s === cur ? "ring-2 ring-forest-400 rounded-lg p-2" : ""}`}>
            <div className="font-semibold capitalize text-bark-700 dark:text-forest-100">
              {s} {s === cur && <span className="text-xs font-normal text-forest-600 dark:text-forest-300">(now)</span>}
            </div>
            <ul className="text-sm text-bark-600 dark:text-forest-300 list-disc ml-5 mt-1 space-y-0.5">
              {(rule.cautions[s] || []).map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="text-xs text-bark-500 dark:text-forest-300 italic">
        Planning support only — always check official NPS alerts and weather before traveling.
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded ${swatch}`} />
      {label}
    </span>
  );
}

function GearTab({ parkCode }: { parkCode: string }) {
  const [season, setSeason] = useState(currentSeason());
  const [style, setStyle] = useState<"camping" | "hotel" | "mixed">("camping");

  const checklist = useMemo(
    () => generateGearChecklist({ parkCodes: [parkCode], season, style, activities: ["Hiking"] }),
    [parkCode, season, style]
  );

  const grouped = useMemo(() => {
    const m = new Map<string, typeof checklist>();
    for (const item of checklist) {
      if (!m.has(item.category)) m.set(item.category, []);
      m.get(item.category)!.push(item);
    }
    return m;
  }, [checklist]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          Season:
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value as typeof season)}
            className="px-2 py-1 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800"
          >
            <option value="spring">Spring</option>
            <option value="summer">Summer</option>
            <option value="fall">Fall</option>
            <option value="winter">Winter</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          Trip style:
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as typeof style)}
            className="px-2 py-1 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800"
          >
            <option value="camping">Camping</option>
            <option value="hotel">Hotel</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
      </div>

      <div className="text-xs text-bark-500 dark:text-forest-300">
        For an editable, persistent checklist, add this park to a trip and edit the gear there.
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped.get(cat);
          if (!items?.length) return null;
          return (
            <Card key={cat} title={CATEGORY_LABEL[cat]}>
              <ul className="space-y-1 text-sm">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center gap-2">
                    <span className="text-forest-500">·</span>
                    <span className="text-bark-700 dark:text-forest-200">{it.label}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function NotesTab({
  parkCode,
  visitedDate,
  rating,
  notes,
  onChange
}: {
  parkCode: string;
  visitedDate?: string;
  rating?: number;
  notes?: string;
  onChange: (patch: { visitedDate?: string; rating?: number; notes?: string }) => void;
}) {
  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <label className="block text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 font-semibold mb-1">Visit date</label>
        <input
          type="date"
          value={visitedDate ?? ""}
          onChange={(e) => onChange({ visitedDate: e.target.value })}
          className="px-3 py-2 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 font-semibold mb-1">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChange({ rating: n })}
              className={`text-2xl ${(rating ?? 0) >= n ? "text-amber-500" : "text-bark-200 dark:text-forest-700"}`}
              aria-label={`${n} stars`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 font-semibold mb-1">Notes</label>
        <textarea
          value={notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={6}
          placeholder={`Memorable hikes, gear that worked, things to do next time at ${parkCode}…`}
          className="w-full px-3 py-2 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
        />
      </div>
      <div className="text-xs text-bark-500 dark:text-forest-300">
        Saved automatically to this browser. Use Settings → Export to back up.
      </div>
    </div>
  );
}

function StargazingTab({ park }: { park: Park }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const darkSky = isDarkSkyPark(park.parkCode);
  const { peak, visible } = getVisibleConstellations(park.latitude, month);
  const viewWindow = bestViewingWindow(park.latitude);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 font-semibold">Viewing month:</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-2 py-1 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
        </label>
        <div className="text-xs text-bark-500 dark:text-forest-300">
          Lat {park.latitude.toFixed(1)}°
        </div>
      </div>

      {darkSky && (
        <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
          <span className="text-2xl flex-shrink-0">🏅</span>
          <div>
            <div className="font-semibold text-indigo-900 dark:text-indigo-100 text-sm">Designated Dark Sky Park</div>
            <div className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
              {park.fullName} has been officially designated by the International Dark-Sky Association for outstanding night sky quality and public star-gazing programs.
            </div>
          </div>
        </div>
      )}

      <div className="bg-forest-50 dark:bg-forest-900/60 border border-forest-200 dark:border-forest-800 rounded-xl p-4">
        <div className="text-xs uppercase tracking-wide text-forest-700 dark:text-forest-300 font-semibold mb-1">Best viewing window</div>
        <div className="text-sm text-forest-800 dark:text-forest-100">{viewWindow}</div>
        <div className="text-xs text-bark-500 dark:text-forest-400 mt-2">
          For the clearest views: arrive 30–60 min after astronomical twilight, let eyes dark-adapt for 20 min, and avoid using white flashlights.
        </div>
      </div>

      {peak.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-forest-700 dark:text-forest-300 font-semibold mb-3">
            ✨ Prime viewing in {MONTH_NAMES[month - 1]} from this park
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {peak.map((c) => (
              <ConstellationCard key={c.id} constellation={c} highlight />
            ))}
          </div>
        </div>
      )}

      {visible.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 font-semibold mb-3">
            Also visible (rising / setting earlier)
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {visible.map((c) => (
              <ConstellationCard key={c.id} constellation={c} />
            ))}
          </div>
        </div>
      )}

      {peak.length === 0 && visible.length === 0 && (
        <div className="text-sm text-bark-500 dark:text-forest-300 italic py-4">
          No major constellations mapped for this latitude and month. Try a different month.
        </div>
      )}

      <div className="text-xs text-bark-400 dark:text-forest-500 italic border-t border-bark-100 dark:border-forest-800 pt-4">
        Visibility windows are approximate. Moon phase, altitude, and atmospheric conditions all affect actual viewing. Check Clear Outside or Stellarium for precise forecasts.
      </div>
    </div>
  );
}

function ConstellationCard({ constellation: c, highlight }: { constellation: ReturnType<typeof getVisibleConstellations>["peak"][0]; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${
      highlight
        ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
        : "bg-white dark:bg-forest-900 border-bark-100 dark:border-forest-800"
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{c.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-bark-800 dark:text-forest-100">{c.name}</div>
          <div className="text-xs text-bark-500 dark:text-forest-400 italic mb-2">{c.englishName} · look {c.direction}</div>
          <p className="text-xs text-bark-600 dark:text-forest-300 leading-relaxed mb-2">{c.description}</p>
          <ul className="space-y-0.5">
            {c.features.map((f, i) => (
              <li key={i} className="text-[11px] text-bark-500 dark:text-forest-400 flex gap-1.5">
                <span className="text-forest-500 flex-shrink-0">·</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
