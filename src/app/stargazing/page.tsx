"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getVisibleConstellations, isDarkSkyPark, MONTH_NAMES, bestViewingWindow, type Constellation } from "@/lib/stargazing";
import { useParks } from "@/hooks/useParks";

const DARK_SKY_PARK_CODES = [
  "nabr", "care", "cany", "arch", "brca", "grca", "grba", "bibe",
  "deva", "sagu", "thro", "chcu", "hove", "flfo", "dino", "blca",
  "josh", "zion", "glac", "grsa", "pefo"
];

const VIEWING_TIPS = [
  { icon: "🌑", tip: "New moon nights are best — check the lunar calendar before planning." },
  { icon: "👁", tip: "Allow 20–30 minutes for your eyes to dark-adapt. Avoid any white light." },
  { icon: "🔴", tip: "Use a red flashlight — red light preserves night vision unlike white or blue." },
  { icon: "🌡", tip: "Temperatures drop fast after sunset at altitude. Bring extra layers." },
  { icon: "🔭", tip: "Binoculars reveal more than you'd expect — great for clusters and nebulae." },
  { icon: "📱", tip: "Apps like Stellarium or SkySafari identify objects in real time." },
  { icon: "📍", tip: "Get away from the campfire and parking lot lights — even 100 ft makes a difference." },
  { icon: "⏰", tip: "Prime window: 1–3 hours after astronomical twilight ends (varies by season)." }
];

export default function StargazingPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [latitude, setLatitude] = useState(38.5); // ~geographic center of contiguous US
  const { parks } = useParks();

  const { peak, visible } = useMemo(
    () => getVisibleConstellations(latitude, month),
    [latitude, month]
  );

  const darkSkyParks = useMemo(
    () => parks.filter((p) => isDarkSkyPark(p.parkCode)),
    [parks]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <div>
        <h1 className="font-display font-bold text-4xl text-forest-800 dark:text-forest-100">
          ⭐ Stargazing Guide
        </h1>
        <p className="text-bark-600 dark:text-forest-300 mt-2 max-w-2xl">
          National parks offer some of the darkest skies in the country. Explore what constellations are visible
          each month, find certified dark sky parks, and get ready for your next night under the stars.
        </p>
      </div>

      {/* Controls */}
      <section className="bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 rounded-2xl p-6 shadow-soft">
        <h2 className="font-display font-bold text-lg text-forest-800 dark:text-forest-100 mb-4">
          What&apos;s in the sky?
        </h2>
        <div className="flex flex-wrap gap-6 mb-6">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 font-semibold">Month</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 font-semibold">
              Your latitude
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={20}
                max={70}
                step={0.5}
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-40 accent-forest-600"
              />
              <span className="text-sm font-mono w-14 text-bark-700 dark:text-forest-200">
                {latitude.toFixed(1)}°N
              </span>
            </div>
            <div className="text-[11px] text-bark-400 dark:text-forest-400">
              {latitude < 27 ? "S. Florida / Hawaii" :
               latitude < 32 ? "Gulf Coast / Southwest" :
               latitude < 37 ? "Mid-South / California" :
               latitude < 42 ? "Midwest / Mid-Atlantic" :
               latitude < 48 ? "Northern States" :
               latitude < 55 ? "Northern border / Alaska" : "Denali / Far North"}
            </div>
          </label>
        </div>

        <div className="text-xs text-bark-500 dark:text-forest-400 bg-forest-50 dark:bg-forest-800/60 rounded-lg px-3 py-2 mb-6">
          Best viewing window at {latitude.toFixed(0)}°N: <span className="font-medium text-forest-700 dark:text-forest-200">{bestViewingWindow(latitude)}</span>
        </div>

        {peak.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wide text-forest-700 dark:text-forest-300 font-semibold mb-3">
              ✨ Peak visibility in {MONTH_NAMES[month - 1]}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {peak.map((c) => (
                <ConstellationCard key={c.id} constellation={c} highlight />
              ))}
            </div>
          </div>
        )}

        {visible.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 font-semibold mb-3">
              Also visible (rising / setting earlier in the night)
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visible.map((c) => (
                <ConstellationCard key={c.id} constellation={c} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Dark Sky Parks */}
      <section>
        <h2 className="font-display font-bold text-2xl text-forest-800 dark:text-forest-100 mb-2">
          🏅 Certified Dark Sky Parks
        </h2>
        <p className="text-bark-600 dark:text-forest-300 text-sm mb-4">
          These NPS units have been officially recognized by the{" "}
          <a href="https://www.darksky.org" target="_blank" rel="noopener noreferrer" className="text-forest-600 dark:text-forest-300 hover:underline">
            International Dark-Sky Association
          </a>{" "}
          for exceptional night sky quality.
        </p>
        {darkSkyParks.length === 0 ? (
          <div className="text-sm text-bark-500 dark:text-forest-300 italic">Loading parks…</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {darkSkyParks.map((p) => (
              <Link
                key={p.parkCode}
                href={`/parks/${p.parkCode}`}
                className="block rounded-xl bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 p-4 hover:shadow-soft hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group"
              >
                <div className="text-lg mb-1">🌌</div>
                <div className="font-semibold text-bark-800 dark:text-forest-100 text-sm group-hover:text-forest-700 dark:group-hover:text-forest-200">
                  {p.fullName}
                </div>
                <div className="text-xs text-bark-500 dark:text-forest-400 mt-0.5">{p.states}</div>
              </Link>
            ))}
          </div>
        )}
        {darkSkyParks.length === 0 && parks.length > 0 && (
          <div className="text-sm text-bark-500 dark:text-forest-300 italic mt-2">
            No certified dark sky parks found in the loaded park data.
          </div>
        )}
      </section>

      {/* Viewing Tips */}
      <section>
        <h2 className="font-display font-bold text-2xl text-forest-800 dark:text-forest-100 mb-4">
          💡 Viewing Tips
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {VIEWING_TIPS.map((tip, i) => (
            <div
              key={i}
              className="flex gap-3 bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 rounded-xl p-4"
            >
              <span className="text-2xl flex-shrink-0">{tip.icon}</span>
              <p className="text-sm text-bark-700 dark:text-forest-200 leading-relaxed">{tip.tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bortle Scale */}
      <section className="bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 rounded-2xl p-6 shadow-soft">
        <h2 className="font-display font-bold text-xl text-forest-800 dark:text-forest-100 mb-4">
          🔭 The Bortle Scale
        </h2>
        <p className="text-sm text-bark-600 dark:text-forest-300 mb-4">
          The Bortle scale measures sky darkness from 1 (darkest rural sky) to 9 (inner city). Most national parks fall between 2–4.
        </p>
        <div className="space-y-2">
          {[
            { class: "1–2", label: "Exceptional dark sky", desc: "Zodiacal light, gegenschein, Milky Way casts faint shadows", color: "bg-indigo-900 text-indigo-100" },
            { class: "3–4", label: "Rural sky", desc: "Milky Way shows intricate structure, M33 galaxy visible to naked eye", color: "bg-indigo-700 text-indigo-100" },
            { class: "5–6", label: "Suburban sky", desc: "Milky Way faint, only 4th magnitude stars visible", color: "bg-amber-500 text-amber-900" },
            { class: "7–9", label: "Urban sky", desc: "Milky Way invisible, only brightest stars and planets", color: "bg-red-500 text-red-100" }
          ].map((row) => (
            <div key={row.class} className="flex items-start gap-3">
              <span className={`text-xs font-bold px-2 py-1 rounded ${row.color} w-14 text-center flex-shrink-0`}>
                {row.class}
              </span>
              <div>
                <div className="text-sm font-semibold text-bark-800 dark:text-forest-100">{row.label}</div>
                <div className="text-xs text-bark-500 dark:text-forest-300">{row.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="text-xs text-bark-400 dark:text-forest-500 italic text-center pb-4">
        Constellation visibility is based on approximate transit times and latitude ranges. Moon phase, weather, and local terrain affect real-world conditions.
        Use Stellarium, SkySafari, or Clear Outside for precise real-time forecasts.
      </div>
    </div>
  );
}

function ConstellationCard({ constellation: c, highlight }: { constellation: Constellation; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${
      highlight
        ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
        : "bg-cream/50 dark:bg-forest-800/40 border-bark-100 dark:border-forest-700"
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{c.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-bark-800 dark:text-forest-100 text-sm">{c.name}</div>
          <div className="text-[11px] text-bark-400 dark:text-forest-400 italic mb-1.5">{c.englishName} · {c.direction}</div>
          <p className="text-xs text-bark-600 dark:text-forest-300 leading-relaxed mb-2">{c.description}</p>
          <ul className="space-y-0.5">
            {c.features.slice(0, 3).map((f, i) => (
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
