"use client";

import { useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/storage";

// Sets the dark class on <html> before paint based on stored preference.
export default function ThemeBoot() {
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.THEME);
      const isDark = stored === "dark";
      document.documentElement.classList.toggle("dark", isDark);
    } catch {
      /* noop */
    }
  }, []);
  return null;
}
