"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";
import UserAvatar from "./UserAvatar";
import { useStored, STORAGE_KEYS, type Profile } from "@/lib/storage";

const NAV_LINKS = [
  { href: "/", label: "Map" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trips", label: "Trips" },
  { href: "/stargazing", label: "⭐ Stargazing" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const [profile] = useStored<Profile>(STORAGE_KEYS.PROFILE, {});

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <div className="ml-2">
            <AuthButton
              session={session}
              status={status}
              avatar={profile.avatar}
              dropdownOpen={dropdownOpen}
              setDropdownOpen={setDropdownOpen}
              dropdownRef={dropdownRef}
            />
          </div>
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
          <div className="mt-2 pt-2 border-t border-bark-100 dark:border-forest-800">
            {session ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-forest-100 dark:hover:bg-forest-800"
                >
                  <UserAvatar avatar={profile.avatar} image={session.user?.image} name={session.user?.name} size={28} />
                  <span className="text-sm font-medium text-forest-800 dark:text-forest-100 truncate max-w-[160px]">
                    {session.user?.name}
                  </span>
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="text-left px-3 py-3 rounded-lg text-sm font-medium text-bark-500 dark:text-forest-400 hover:bg-forest-100 dark:hover:bg-forest-800"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); signIn("google"); }}
                className="w-full flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium text-forest-800 dark:text-forest-100 hover:bg-forest-100 dark:hover:bg-forest-800"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function AuthButton({
  session,
  status,
  avatar,
  dropdownOpen,
  setDropdownOpen,
  dropdownRef,
}: {
  session: ReturnType<typeof useSession>["data"];
  status: ReturnType<typeof useSession>["status"];
  avatar?: string;
  dropdownOpen: boolean;
  setDropdownOpen: (v: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}) {
  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-forest-100 dark:bg-forest-800 animate-pulse" />;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-bark-200 dark:border-forest-700 text-sm font-medium text-forest-800 dark:text-forest-100 hover:bg-forest-100 dark:hover:bg-forest-800 transition-colors"
      >
        <GoogleIcon />
        Sign in
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-forest-100 dark:hover:bg-forest-800 transition-colors"
        aria-label="Account menu"
      >
        <UserAvatar avatar={avatar} image={session.user?.image} name={session.user?.name} size={30} />
        <span className="text-sm font-medium text-forest-800 dark:text-forest-100 max-w-[100px] truncate">
          {session.user?.name?.split(" ")[0]}
        </span>
        <svg className="w-3 h-3 text-bark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-cream dark:bg-forest-900 border border-bark-100 dark:border-forest-700 rounded-xl shadow-soft overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-bark-100 dark:border-forest-800">
            <p className="text-xs text-bark-500 dark:text-forest-400">Signed in as</p>
            <p className="text-sm font-medium text-forest-800 dark:text-forest-100 truncate">{session.user?.email}</p>
          </div>
          <Link
            href="/account"
            onClick={() => setDropdownOpen(false)}
            className="block w-full text-left px-4 py-3 text-sm text-forest-800 dark:text-forest-100 hover:bg-forest-100 dark:hover:bg-forest-800 transition-colors"
          >
            Profile &amp; achievements
          </Link>
          <button
            onClick={() => { setDropdownOpen(false); signOut(); }}
            className="w-full text-left px-4 py-3 text-sm text-forest-800 dark:text-forest-100 hover:bg-forest-100 dark:hover:bg-forest-800 transition-colors border-t border-bark-100 dark:border-forest-800"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-3 py-1.5 rounded-full hover:bg-forest-100 dark:hover:bg-forest-800 text-forest-800 dark:text-forest-100 font-medium">
      {children}
    </Link>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
