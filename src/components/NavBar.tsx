import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 bg-cream/90 dark:bg-forest-900/90 backdrop-blur border-b border-bark-100 dark:border-forest-800">
      <div className="max-w-7xl mx-auto h-16 px-4 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="Trail Blazer logo"
            width={42}
            height={42}
            className="rounded-md"
            priority
          />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold text-forest-800 dark:text-forest-100">Trail Blazer</div>
            <div className="text-[11px] uppercase tracking-wide text-bark-500 dark:text-forest-300">National Parks Tracker</div>
          </div>
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          <NavLink href="/">Map</NavLink>
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/trips">Trips</NavLink>
          <NavLink href="/stargazing">⭐ Stargazing</NavLink>
          <NavLink href="/settings">Settings</NavLink>
          <div className="ml-2"><ThemeToggle /></div>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-full hover:bg-forest-100 dark:hover:bg-forest-800 text-forest-800 dark:text-forest-100 font-medium"
    >
      {children}
    </Link>
  );
}
