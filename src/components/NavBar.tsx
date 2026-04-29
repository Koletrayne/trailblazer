"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Map" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trips", label: "Trips" },
  { href: "/stargazing", label: "⭐ Stargazing" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-cream/90 dark:bg-forest-900/90 backdrop-blur border-b border-bark-100 dark:border-forest-800">
      <div className="max-w-7xl mx-auto h-16 px-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3 group" onClick={() => setMenuOpen(false)}>
          <Image src="/logo.png" alt="Trail Blazer logo" width={42} height={42} className="rounded-md" priority />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold text-forest-800 dark:text-forest-100">Trail Blazer</div>
            <div className="text-[11px] uppercase tracking-wide text-bark-500 dark:text-forest-300">National Parks Tracker</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-auto hidden md:flex items-center gap-1 text-sm">
          {NAV_LINKS.map((l) => <NavLink key={l.href} href={l.href}>{l.label}</NavLink>)}
          <div className="ml-2"><ThemeToggle /></div>
        </nav>

        {/* Mobile: theme toggle + hamburger */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 rounded-md text-forest-800 dark:text-forest-100 hover:bg-forest-100 dark:hover:bg-forest-800"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-bark-100 dark:border-forest-800 bg-cream/95 dark:bg-forest-900/95 px-4 py-2 flex flex-col">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="px-3 py-3 rounded-lg text-sm font-medium text-forest-800 dark:text-forest-100 hover:bg-forest-100 dark:hover:bg-forest-800"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-3 py-1.5 rounded-full hover:bg-forest-100 dark:hover:bg-forest-800 text-forest-800 dark:text-forest-100 font-medium">
      {children}
    </Link>
  );
}
