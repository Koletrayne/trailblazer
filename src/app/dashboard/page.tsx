"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParks } from "@/hooks/useParks";
import { useStatuses } from "@/hooks/useStatuses";
import { getBadges, badgeProgress, isBadgeEarned } from "@/lib/badges";
import { statusForMonth } from "@/lib/seasonRules";
import StatusBadge from "@/components/StatusBadge";
import type { Park, Status } from "@/types";

export default function DashboardPage() {
  const { parks, loading } = useParks();
  const { statuses, getStatus } = useStatuses();

  const counts = useMemo(() => {
    const c: Record<Status, number> = { not_visited: 0, wishlist: 0, planned: 0, visited: 0 };
    for (const p of parks) c[getStatus(p.parkCode)]++;
    return c;
  }, [parks, getStatus]);

  const visitedParks = parks.filter((p) => getStatus(p.parkCode) === "visited");
  const plannedParks = parks.filter((p) => getStatus(p.parkCode) === "planned");
  const wishlistParks = parks.filter((p) => getStatus(p.parkCode) === "wishlist");

  const total = parks.length || 63;
  const pct = total > 0 ? Math.round((counts.visited / total) * 100) : 0;

  const visitedStates = useMemo(() => {
    const s = new Set<string>();
    for (const p of visitedParks) p.states.split(",").forEach((x) => s.add(x.trim()));
    return s;
  }, [visitedParks]);

  const recentlyVisited = useMemo(() => {
    return statuses
      .filter((s) => s.status === "visited" && s.visitedDate)
      .sort((a, b) => (b.visitedDate ?? "").localeCompare(a.visitedDate ?? ""))
      .slice(0, 5);
  }, [statuses]);

  const month = new Date().getMonth() + 1;
  const parkOfDay = useMemo(() => pickParkOfDay(parks, getStatus, month), [parks, getStatus, month]);

  const badges = getBadges();

  if (loading) {
    return <div className="p-8 text-bark-500 dark:text-forest-300">Loading dashboard…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="font-display font-bold text-3xl text-forest-800 dark:text-forest-100">Dashboard</h1>
      <p className="text-bark-500 dark:text-forest-300 mt-1">Your national park progress at a glance.</p>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Visited" value={counts.visited} accent="forest" />
        <Stat label="Planned" value={counts.planned} accent="sky" />
        <Stat label="Wishlist" value={counts.wishlist} accent="amber" />
        <Stat label="Remaining" value={counts.not_visited} accent="bark" />
      </div>

      <div className="mt-6 rounded-xl bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 p-5 shadow-soft">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300">Completion</div>
            <div className="font-display text-2xl font-bold text-forest-800 dark:text-forest-100">
              {counts.visited} / {total} parks <span className="text-bark-500 dark:text-forest-300 text-base font-normal">· {pct}%</span>
            </div>
          </div>
          <div className="text-sm text-bark-500 dark:text-forest-300">
            {visitedStates.size} states reached
          </div>
        </div>
        <div className="mt-3 h-3 rounded-full bg-bark-100 dark:bg-forest-800 overflow-hidden">
          <div className="h-full bg-forest-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {parkOfDay && (
        <div className="mt-6 rounded-xl bg-gradient-to-br from-forest-600 to-forest-800 text-white p-5 shadow-soft">
          <div className="text-xs uppercase tracking-wide opacity-80">Park of the day · this is a great time to visit</div>
          <div className="font-display text-2xl font-bold mt-1">{parkOfDay.fullName}</div>
          <div className="text-sm opacity-90 mt-1">{parkOfDay.designation} · {parkOfDay.states}</div>
          <Link
            href={`/parks/${parkOfDay.parkCode}`}
            className="inline-block mt-3 bg-white text-forest-800 text-sm font-semibold px-4 py-2 rounded-full hover:bg-forest-50"
          >
            Explore →
          </Link>
        </div>
      )}

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <Section title="Recently visited">
          {recentlyVisited.length === 0 ? (
            <Empty>No visits logged yet. Add a visit date on a park&apos;s notes tab.</Empty>
          ) : (
            <ul className="divide-y divide-bark-100 dark:divide-forest-800">
              {recentlyVisited.map((s) => {
                const p = parks.find((x) => x.parkCode === s.parkCode);
                if (!p) return null;
                return (
                  <li key={s.parkCode} className="py-2.5 flex items-center justify-between">
                    <Link href={`/parks/${p.parkCode}`} className="font-semibold text-bark-800 dark:text-forest-100 hover:underline">
                      {p.fullName}
                    </Link>
                    <span className="text-xs text-bark-500 dark:text-forest-300">{s.visitedDate}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Wishlist">
          {wishlistParks.length === 0 ? (
            <Empty>Mark some parks as wishlist on the map to plan your bucket list.</Empty>
          ) : (
            <ul className="divide-y divide-bark-100 dark:divide-forest-800">
              {wishlistParks.slice(0, 8).map((p) => (
                <li key={p.parkCode} className="py-2.5 flex items-center justify-between">
                  <Link href={`/parks/${p.parkCode}`} className="font-semibold text-bark-800 dark:text-forest-100 hover:underline">
                    {p.fullName}
                  </Link>
                  <span className="text-xs text-bark-500 dark:text-forest-300">{p.states}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-8">
        <h2 className="font-display font-bold text-2xl text-forest-800 dark:text-forest-100">Achievements</h2>
        <p className="text-sm text-bark-500 dark:text-forest-300 mt-1">Earn badges by visiting themed groups of parks.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {badges.map((b) => {
            const { earned, total: bTotal } = badgeProgress(b, statuses);
            const earnedAll = isBadgeEarned(b, statuses);
            const pct = bTotal > 0 ? Math.round((earned / bTotal) * 100) : 0;
            return (
              <div
                key={b.id}
                className={`rounded-xl p-4 border shadow-soft ${
                  earnedAll
                    ? "bg-forest-50 dark:bg-forest-800 border-forest-300 dark:border-forest-600"
                    : "bg-white dark:bg-forest-900 border-bark-100 dark:border-forest-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-display font-bold text-bark-800 dark:text-forest-100">{b.label}</div>
                  {earnedAll && <span className="text-xl" title="Earned">🏆</span>}
                </div>
                <p className="text-xs text-bark-500 dark:text-forest-300 mt-1 leading-snug">{b.description}</p>
                <div className="mt-3 h-1.5 rounded-full bg-bark-100 dark:bg-forest-800 overflow-hidden">
                  <div className="h-full bg-forest-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-bark-500 dark:text-forest-300 mt-1">{earned}/{bTotal}</div>
              </div>
            );
          })}
        </div>
      </div>

      {plannedParks.length > 0 && (
        <Section title="Planned trips" className="mt-8">
          <ul className="divide-y divide-bark-100 dark:divide-forest-800">
            {plannedParks.map((p) => (
              <li key={p.parkCode} className="py-2.5 flex items-center justify-between">
                <Link href={`/parks/${p.parkCode}`} className="font-semibold text-bark-800 dark:text-forest-100 hover:underline">
                  {p.fullName}
                </Link>
                <StatusBadge status="planned" />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function pickParkOfDay(parks: Park[], statusOf: (c: string) => Status, month: number): Park | null {
  if (parks.length === 0) return null;
  // Prefer wishlist > not_visited, in-season, deterministic per day
  const wishlist = parks.filter((p) => statusOf(p.parkCode) === "wishlist" && statusForMonth(p.parkCode, month) === "best");
  const inSeasonNew = parks.filter((p) => statusOf(p.parkCode) === "not_visited" && statusForMonth(p.parkCode, month) === "best");
  const candidates = wishlist.length > 0 ? wishlist : inSeasonNew.length > 0 ? inSeasonNew : parks;
  const day = Math.floor(Date.now() / 86_400_000);
  return candidates[day % candidates.length];
}

function Stat({
  label,
  value,
  accent
}: {
  label: string;
  value: number;
  accent: "forest" | "sky" | "amber" | "bark";
}) {
  const colors = {
    forest: "bg-forest-100 dark:bg-forest-800 text-forest-800 dark:text-forest-100",
    sky: "bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
    bark: "bg-bark-100 dark:bg-forest-800 text-bark-800 dark:text-forest-100"
  }[accent];
  return (
    <div className={`rounded-xl p-4 ${colors}`}>
      <div className="text-xs uppercase tracking-wide opacity-75 font-semibold">{label}</div>
      <div className="font-display text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
  className
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 p-5 shadow-soft ${className ?? ""}`}>
      <h3 className="font-display font-bold text-lg text-forest-800 dark:text-forest-100 mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-bark-500 dark:text-forest-300 italic">{children}</div>;
}
