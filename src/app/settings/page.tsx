"use client";

import { useRef, useState } from "react";
import { exportAllData, importAllData, useStored, STORAGE_KEYS, type Profile } from "@/lib/storage";
import { useStatuses } from "@/hooks/useStatuses";
import { useTrips } from "@/hooks/useTrips";

export default function SettingsPage() {
  const [profile, setProfile] = useStored<Profile>(STORAGE_KEYS.PROFILE, {});
  const { statuses } = useStatuses();
  const { trips } = useTrips();
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function downloadExport() {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trailblazer-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setImportText(text);
      const res = importAllData(text);
      setImportStatus(res.ok ? "Imported successfully — refresh to see changes." : `Failed: ${res.error}`);
    };
    reader.readAsText(file);
  }

  function clearAll() {
    if (!confirm("Erase all visit history, trips, and notes? This can't be undone.")) return;
    window.localStorage.removeItem(STORAGE_KEYS.STATUSES);
    window.localStorage.removeItem(STORAGE_KEYS.TRIPS);
    window.localStorage.removeItem(STORAGE_KEYS.PROFILE);
    window.location.reload();
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-forest-800 dark:text-forest-100">Settings</h1>
        <p className="text-bark-500 dark:text-forest-300 mt-1">Manage your data and preferences. Everything lives in this browser.</p>
      </div>

      <Card title="Profile">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Home city">
            <input
              type="text"
              value={profile.homeCity ?? ""}
              onChange={(e) => setProfile({ ...profile, homeCity: e.target.value })}
              placeholder="e.g. Denver, CO"
              className="w-full px-2 py-1.5 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
            />
          </Field>
          <Field label="Home latitude">
            <input
              type="number"
              step="0.0001"
              value={profile.homeLat ?? ""}
              onChange={(e) => setProfile({ ...profile, homeLat: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
              placeholder="39.7392"
              className="w-full px-2 py-1.5 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
            />
          </Field>
          <Field label="Home longitude">
            <input
              type="number"
              step="0.0001"
              value={profile.homeLon ?? ""}
              onChange={(e) => setProfile({ ...profile, homeLon: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
              placeholder="-104.9903"
              className="w-full px-2 py-1.5 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
            />
          </Field>
        </div>
        <p className="text-xs text-bark-500 dark:text-forest-300 mt-2">
          Used to compute distance to parks (future feature). Find coords for your home city on Google Maps.
        </p>
      </Card>

      <Card title="Your data">
        <ul className="text-sm space-y-1 mb-4">
          <li><strong>{statuses.length}</strong> park statuses tracked</li>
          <li><strong>{trips.length}</strong> trips saved</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadExport}
            className="bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold px-4 py-2 rounded-full"
          >
            ⬇ Export to JSON
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="bg-cream dark:bg-forest-800 text-forest-800 dark:text-forest-100 text-sm font-semibold px-4 py-2 rounded-full border border-bark-200 dark:border-forest-700"
          >
            ⬆ Import JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onFileSelected} />
          <button
            onClick={clearAll}
            className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-sm font-semibold px-4 py-2 rounded-full border border-red-200 dark:border-red-800"
          >
            Erase all data
          </button>
        </div>
        {importStatus && (
          <div className="mt-3 text-sm text-bark-700 dark:text-forest-200 bg-cream dark:bg-forest-800 p-2 rounded">
            {importStatus}
          </div>
        )}
        {importText && (
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-bark-500 dark:text-forest-300">Imported file contents</summary>
            <pre className="mt-2 p-2 bg-cream dark:bg-forest-800 rounded overflow-auto max-h-48 text-bark-700 dark:text-forest-200">{importText}</pre>
          </details>
        )}
      </Card>

      <Card title="About">
        <ul className="text-sm space-y-2 text-bark-700 dark:text-forest-200">
          <li><strong>Park data:</strong> National Park Service Developer API</li>
          <li><strong>Map tiles:</strong> OpenStreetMap (free, but check usage limits before public launch)</li>
          <li><strong>Storage:</strong> All your data lives in this browser&apos;s localStorage. Use Export to back up.</li>
          <li><strong>Future:</strong> Recreation.gov enrichment, account login + cloud sync, AI trip suggestions</li>
        </ul>
      </Card>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 mb-1 font-semibold">{label}</span>
      {children}
    </label>
  );
}
