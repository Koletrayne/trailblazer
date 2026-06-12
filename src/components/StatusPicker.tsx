"use client";

import { useState } from "react";
import type { Status } from "@/types";
import { useStatuses } from "@/hooks/useStatuses";

const OPTIONS: { value: Status; label: string; emoji: string }[] = [
  { value: "not_visited", label: "Not visited", emoji: "·" },
  { value: "wishlist", label: "Wishlist", emoji: "★" },
  { value: "planned", label: "Planned", emoji: "📅" },
  { value: "visited", label: "Visited", emoji: "✓" }
];

const MAX = 160;

export default function StatusPicker({ parkCode }: { parkCode: string }) {
  const { getStatus, getStatusObject, setStatus, updateStatus } = useStatuses();
  const current = getStatus(parkCode);
  const statusObj = getStatusObject(parkCode);
  const [showPrompt, setShowPrompt] = useState(false);
  const [draft, setDraft] = useState("");

  function handleClick(status: Status) {
    if (status === "visited" && current !== "visited") {
      setStatus(parkCode, "visited");
      setDraft("");
      setShowPrompt(true);
    } else {
      setStatus(parkCode, status);
      setShowPrompt(false);
    }
  }

  function saveMemory() {
    if (draft.trim()) updateStatus(parkCode, { memory: draft.trim() });
    setShowPrompt(false);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        {OPTIONS.map((opt) => {
          const active = current === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleClick(opt.value)}
              className={`text-sm py-1.5 px-2 rounded-md font-medium border transition-colors ${
                active
                  ? "bg-forest-600 text-white border-forest-700"
                  : "bg-white dark:bg-forest-800 text-forest-800 dark:text-forest-100 border-bark-100 dark:border-forest-700 hover:bg-forest-50 dark:hover:bg-forest-700"
              }`}
            >
              <span className="mr-1.5">{opt.emoji}</span>{opt.label}
            </button>
          );
        })}
      </div>

      {showPrompt && (
        <div className="rounded-lg bg-forest-50 dark:bg-forest-800/60 border border-forest-200 dark:border-forest-700 p-3 space-y-2">
          <div className="text-xs font-semibold text-forest-700 dark:text-forest-200 uppercase tracking-wide">
            What&apos;s your memory here?
          </div>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX))}
            placeholder="Saw a black bear 20ft away. Would absolutely cry again."
            rows={3}
            className="w-full text-sm px-2 py-1.5 rounded border border-forest-200 dark:border-forest-600 bg-white dark:bg-forest-900 text-bark-800 dark:text-forest-100 resize-none focus:outline-none focus:border-forest-400"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-bark-400 dark:text-forest-500">{draft.length}/{MAX}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPrompt(false)}
                className="text-xs text-bark-500 dark:text-forest-400 hover:underline"
              >
                Skip
              </button>
              <button
                onClick={saveMemory}
                className="text-xs bg-forest-600 text-white px-3 py-1 rounded-full hover:bg-forest-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {!showPrompt && current === "visited" && statusObj?.memory && (
        <div className="pl-3 border-l-2 border-forest-400">
          <p className="text-xs italic text-bark-600 dark:text-forest-300 leading-relaxed">
            &ldquo;{statusObj.memory}&rdquo;
          </p>
          <button
            onClick={() => { setDraft(statusObj.memory ?? ""); setShowPrompt(true); }}
            className="text-xs text-bark-400 dark:text-forest-500 hover:underline mt-1"
          >
            Edit memory
          </button>
        </div>
      )}
    </div>
  );
}
