"use client";

import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(STORAGE_KEYS.THEME, next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="rounded-full px-3 py-1.5 text-sm bg-forest-100 dark:bg-forest-800 text-forest-800 dark:text-forest-100 hover:bg-forest-200 dark:hover:bg-forest-700 transition-colors"
      aria-label={dark ? "Switch to light mode" : "Switch to campfire (dark) mode"}
      title={dark ? "Light mode" : "Campfire mode"}
    >
      {dark ? "☀ Day" : "🔥 Campfire"}
    </button>
  );
}
