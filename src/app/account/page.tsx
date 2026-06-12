"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useStored, STORAGE_KEYS, type Profile } from "@/lib/storage";
import { useParks } from "@/hooks/useParks";
import { useStatuses } from "@/hooks/useStatuses";
import { getBadges, badgeProgress, isBadgeEarned } from "@/lib/badges";
import UserAvatar, { AVATAR_CHOICES } from "@/components/UserAvatar";

export default function AccountPage() {
  const { data: session, status: authStatus } = useSession();
  const [profile, setProfile] = useStored<Profile>(STORAGE_KEYS.PROFILE, {});
  const { parks } = useParks();
  const { statuses } = useStatuses();

  const displayName = profile.displayName || session?.user?.name || "Trailblazer";

  const visitedCount = useMemo(
    () => statuses.filter((s) => s.status === "visited").length,
    [statuses]
  );

  const statesReached = useMemo(() => {
    const visited = new Set(
      statuses.filter((s) => s.status === "visited").map((s) => s.parkCode)
    );
    const set = new Set<string>();
    for (const p of parks) {
      if (visited.has(p.parkCode)) {
        p.states.split(",").forEach((x) => set.add(x.trim()));
      }
    }
    return set.size;
  }, [parks, statuses]);

  const badges = getBadges();
  const earnedBadges = badges.filter((b) => isBadgeEarned(b, statuses)).length;

  const memories = useMemo(() => {
    return statuses
      .filter((s) => s.memory)
      .map((s) => {
        const park = parks.find((p) => p.parkCode === s.parkCode);
        if (!park) return null;
        return { park, memory: s.memory!, visitedDate: s.visitedDate };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [statuses, parks]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-forest-800 dark:text-forest-100">Account</h1>
        <p className="text-bark-500 dark:text-forest-300 mt-1">Your profile, avatar, and achievements.</p>
      </div>

      {/* Profile header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <UserAvatar
            avatar={profile.avatar}
            image={session?.user?.image}
            name={displayName}
            size={88}
          />
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={profile.displayName ?? ""}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              placeholder={session?.user?.name || "Your name"}
              className="font-display text-2xl font-bold text-forest-800 dark:text-forest-100 bg-transparent border-b border-transparent hover:border-bark-200 dark:hover:border-forest-700 focus:border-forest-400 focus:outline-none w-full max-w-xs"
            />
            {session?.user?.email ? (
              <div className="text-sm text-bark-500 dark:text-forest-300 mt-1">{session.user.email}</div>
            ) : (
              <div className="text-sm text-bark-500 dark:text-forest-300 mt-1 italic">Not signed in</div>
            )}
          </div>
          <div className="flex-shrink-0">
            {authStatus === "loading" ? null : session ? (
              <button
                onClick={() => signOut()}
                className="text-sm bg-cream dark:bg-forest-800 text-forest-800 dark:text-forest-100 font-semibold px-4 py-2 rounded-full border border-bark-200 dark:border-forest-700 hover:bg-bark-50 dark:hover:bg-forest-700"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="text-sm bg-forest-600 hover:bg-forest-700 text-white font-semibold px-4 py-2 rounded-full"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Avatar picker */}
      <Card>
        <h2 className="font-display font-bold text-lg text-forest-800 dark:text-forest-100 mb-1">Choose your avatar</h2>
        <p className="text-xs text-bark-500 dark:text-forest-300 mb-4">
          Pick an emoji avatar. {session?.user?.image ? "Clear it to use your Google photo." : ""}
        </p>
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {AVATAR_CHOICES.map((emoji) => {
            const selected = profile.avatar === emoji;
            return (
              <button
                key={emoji}
                onClick={() => setProfile({ ...profile, avatar: emoji })}
                className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-colors ${
                  selected
                    ? "bg-forest-600 ring-2 ring-forest-400 ring-offset-2 ring-offset-white dark:ring-offset-forest-900"
                    : "bg-cream dark:bg-forest-800 hover:bg-forest-100 dark:hover:bg-forest-700"
                }`}
                aria-label={`Select ${emoji} avatar`}
                aria-pressed={selected}
              >
                {emoji}
              </button>
            );
          })}
        </div>
        {profile.avatar && (
          <button
            onClick={() => setProfile({ ...profile, avatar: undefined })}
            className="mt-3 text-xs text-forest-600 dark:text-forest-300 hover:underline"
          >
            Clear avatar{session?.user?.image ? " (use Google photo)" : ""}
          </button>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Parks visited" value={visitedCount} />
        <Stat label="States reached" value={statesReached} />
        <Stat label="Badges earned" value={earnedBadges} />
      </div>

      {/* Memory Wall */}
      {memories.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display font-bold text-2xl text-forest-800 dark:text-forest-100">Memory wall</h2>
            <span className="text-sm text-bark-500 dark:text-forest-300">{memories.length} {memories.length === 1 ? "memory" : "memories"}</span>
          </div>
          <p className="text-sm text-bark-500 dark:text-forest-300 mt-1 mb-4">
            Your one-sentence captures from each park you&apos;ve visited.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {memories.map(({ park, memory, visitedDate }) => (
              <Link
                key={park.parkCode}
                href={`/parks/${park.parkCode}`}
                className="group rounded-xl overflow-hidden bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 shadow-soft hover:border-forest-300 dark:hover:border-forest-600 transition-colors"
              >
                {park.images?.[0]?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={park.images[0].url}
                    alt={park.fullName}
                    className="h-32 w-full object-cover"
                  />
                )}
                <div className="p-3">
                  <div className="text-xs font-semibold text-bark-500 dark:text-forest-400 uppercase tracking-wide mb-1">
                    {park.fullName}
                  </div>
                  <blockquote className="text-sm italic text-forest-800 dark:text-forest-100 leading-snug">
                    &ldquo;{memory}&rdquo;
                  </blockquote>
                  {visitedDate && (
                    <div className="text-xs text-bark-400 dark:text-forest-500 mt-2">{visitedDate}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display font-bold text-2xl text-forest-800 dark:text-forest-100">Achievements</h2>
          <span className="text-sm text-bark-500 dark:text-forest-300">{earnedBadges} / {badges.length} earned</span>
        </div>
        <p className="text-sm text-bark-500 dark:text-forest-300 mt-1">
          Earn badges by visiting themed groups of parks. Mark parks as visited on the{" "}
          <Link href="/" className="text-forest-600 dark:text-forest-300 hover:underline">map</Link>.
        </p>
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
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 p-5 shadow-soft">
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl p-4 bg-forest-100 dark:bg-forest-800 text-forest-800 dark:text-forest-100">
      <div className="text-xs uppercase tracking-wide opacity-75 font-semibold">{label}</div>
      <div className="font-display text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}
