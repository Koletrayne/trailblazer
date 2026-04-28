// Great-circle distance using the haversine formula. Returns miles.
export function haversineMiles(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Approximate driving distance — straight-line × winding factor.
// (Real routing comes from Google/Mapbox Directions later.)
export function approximateDriveMiles(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  return haversineMiles(a, b) * 1.25;
}

export function approximateDriveHours(miles: number, avgMph = 55): number {
  return miles / avgMph;
}

export function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`;
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm === 0 ? `${hh} hr` : `${hh} hr ${mm} min`;
}
