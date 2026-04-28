# Trail Blazer

A personal command center for U.S. National Parks: an interactive map, visit tracker, trip planner, and gear/seasonal advisor.

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:3000

The NPS API key is already wired up in `.env.local`. If you ever rotate it, update that file.

## What's inside

- **Map**: every U.S. National Park as a pin, color-coded by your status (visited / planned / wishlist / not visited).
- **Park detail**: photos, alerts, fees, hours, activities, campgrounds, season guidance, gear recommendations, personal notes.
- **Dashboard**: visited count, completion %, region breakdown, achievement badges, park-of-the-day suggestion.
- **Trip planner**: add parks, drag to reorder stops, generate a Google Maps route link, auto-built gear checklist, rough trip cost estimate, print-friendly packet.
- **Settings**: export/import all your data as JSON, dark "campfire" mode toggle.

All user data lives in your browser's `localStorage` — nothing is sent anywhere except the NPS API.

## Tech

Next.js 14 (App Router) · TypeScript · Tailwind · Leaflet · React Query · dnd-kit

## Data sources

- [NPS API](https://www.nps.gov/subjects/developer/) — primary source for park data, photos, alerts, hours, fees, activities, campgrounds.
- Curated season + gear rules in `src/data/`.
- (Future) Recreation.gov / RIDB for richer campground enrichment — see comments in `src/lib/nps.ts`.

## Layout

```
src/
├── app/                  # Next.js App Router pages + API routes
├── components/           # UI components
├── lib/                  # NPS client, storage, rules, helpers
├── hooks/                # React hooks for parks/statuses/trips
├── types/                # TypeScript types
└── data/                 # Static seed parks + curated JSON
```
