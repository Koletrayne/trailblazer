import type { Trip } from "@/types";

export type ScheduledDay = {
  dayNumber: number;
  date?: string;
  parkCode: string;
  isTravelDay: boolean;
};

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Turn a trip's stops + nights into a flat list of days. Each stop owns
 * `nights` days; the final stop gets one extra (the departure day). A stop
 * with no nights still gets one day so it appears on the grid. The first day
 * of any stop after the first is flagged as a travel day.
 */
export function buildDaySchedule(trip: Trip): ScheduledDay[] {
  const stops = trip.routeStops.length
    ? trip.routeStops
    : trip.parkCodes.map((c) => ({ parkCode: c, nights: undefined as number | undefined }));

  const days: ScheduledDay[] = [];
  let dayNumber = 1;

  stops.forEach((stop, i) => {
    const nights = Math.max(stop.nights ?? 0, 0);
    const isLast = i === stops.length - 1;
    const daysAtStop = Math.max(isLast ? nights + 1 : nights, 1);

    for (let d = 0; d < daysAtStop; d++) {
      days.push({
        dayNumber,
        parkCode: stop.parkCode,
        isTravelDay: d === 0 && i > 0,
        date: trip.startDate ? addDays(trip.startDate, dayNumber - 1) : undefined
      });
      dayNumber++;
    }
  });

  return days;
}

export function formatDayDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
