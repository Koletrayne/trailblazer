"use client";

import { useState } from "react";
import type { GearItem } from "@/types";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "@/lib/gearRules";

export default function GearChecklist({
  items,
  onChange
}: {
  items: GearItem[];
  onChange: (next: GearItem[]) => void;
}) {
  const [newLabel, setNewLabel] = useState("");

  function toggle(id: string) {
    onChange(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  }
  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }
  function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    onChange([
      ...items,
      {
        id: `gear-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        label: newLabel.trim(),
        category: "personal",
        checked: false
      }
    ]);
    setNewLabel("");
  }

  const grouped = new Map<string, GearItem[]>();
  for (const item of items) {
    if (!grouped.has(item.category)) grouped.set(item.category, []);
    grouped.get(item.category)!.push(item);
  }

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-bark-500 dark:text-forest-300">
          {checkedCount} / {items.length} packed
        </div>
        <div className="h-1.5 w-32 rounded-full bg-bark-100 dark:bg-forest-800 overflow-hidden">
          <div
            className="h-full bg-forest-500 transition-all"
            style={{ width: items.length === 0 ? "0%" : `${(checkedCount / items.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {CATEGORY_ORDER.map((cat) => {
          const list = grouped.get(cat);
          if (!list?.length) return null;
          return (
            <div key={cat} className="rounded-lg bg-cream/60 dark:bg-forest-800/40 p-3">
              <div className="text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 mb-2 font-semibold">
                {CATEGORY_LABEL[cat]}
              </div>
              <ul className="space-y-1">
                {list.map((it) => (
                  <li key={it.id} className="flex items-center gap-2 group">
                    <input
                      id={it.id}
                      type="checkbox"
                      checked={it.checked}
                      onChange={() => toggle(it.id)}
                      className="w-4 h-4 accent-forest-600"
                    />
                    <label
                      htmlFor={it.id}
                      className={`text-sm flex-1 ${it.checked ? "line-through text-bark-400 dark:text-forest-400" : "text-bark-700 dark:text-forest-200"}`}
                    >
                      {it.label}
                    </label>
                    <button
                      onClick={() => remove(it.id)}
                      className="text-bark-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <form onSubmit={addItem} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Add custom item…"
          className="flex-1 px-3 py-2 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm"
        />
        <button
          type="submit"
          className="bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold px-4 rounded"
        >
          + Add
        </button>
      </form>
    </div>
  );
}
