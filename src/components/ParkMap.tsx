"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { Park, Status } from "@/types";
import { haversineMiles } from "@/lib/distance";

const STATUS_COLOR: Record<Status, string> = {
  not_visited: "#8b8378",
  wishlist: "#d4a437",
  planned: "#3b7bd0",
  visited: "#3f7345"
};

export const REVEAL_RADIUS_MILES = 155;

type LatLon = { lat: number; lon: number };

function makeIcon(status: Status, faint: boolean) {
  if (faint) {
    return L.divIcon({
      html: `<div class="pin-faint"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
      className: "tb-marker"
    });
  }
  return L.divIcon({
    html: `<div class="pin pin-${status}" style="background:${STATUS_COLOR[status]}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    className: "tb-marker"
  });
}

function makeMonumentIcon() {
  return L.divIcon({
    html: `<div style="width:12px;height:12px;background:#c9762e;border:2px solid white;border-radius:2px;transform:rotate(45deg);box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    className: "tb-monument-marker"
  });
}

function isRevealed(
  park: Park,
  fogEnabled: boolean,
  reveals: LatLon[],
  statusOf: (code: string) => Status
): boolean {
  if (!fogEnabled) return true;
  if (statusOf(park.parkCode) === "visited") return true;
  return reveals.some(
    (r) => haversineMiles({ lat: park.latitude, lon: park.longitude }, r) <= REVEAL_RADIUS_MILES
  );
}

/* ----------------------------- Fog canvas layer ----------------------------- */
// A canvas in the overlay pane (below markers). We paint solid fog, then erase
// soft circles around each visited park with `destination-out` so overlapping
// reveals merge cleanly instead of fighting an even-odd polygon fill.

type FogOptions = {
  getReveals: () => LatLon[];
  radiusMiles: number;
  color: string;
  opacity: number;
};

function pixelRadius(map: L.Map, center: LatLon, miles: number): number {
  const c = map.latLngToContainerPoint([center.lat, center.lon]);
  const degLon = miles / (Math.cos((center.lat * Math.PI) / 180) * 69.0);
  const edge = map.latLngToContainerPoint([center.lat, center.lon + degLon]);
  return Math.abs(edge.x - c.x);
}

const FogLayerClass = (L.Layer as unknown as { extend: (o: object) => new (opts: FogOptions) => L.Layer }).extend({
  initialize(this: { options: FogOptions }, options: FogOptions) {
    L.setOptions(this, options);
  },
  onAdd(this: any, map: L.Map) {
    this._map = map;
    const canvas = L.DomUtil.create("canvas", "tb-fog-canvas") as HTMLCanvasElement;
    this._canvas = canvas;
    map.getPane("overlayPane")!.appendChild(canvas);
    map.on("move moveend zoomend resize viewreset", this._reset, this);
    if (map.options.zoomAnimation && L.Browser.any3d) {
      map.on("zoomanim", this._animateZoom, this);
    }
    this._reset();
  },
  onRemove(this: any, map: L.Map) {
    L.DomUtil.remove(this._canvas);
    map.off("move moveend zoomend resize viewreset", this._reset, this);
    map.off("zoomanim", this._animateZoom, this);
  },
  _animateZoom(this: any, e: { zoom: number; center: L.LatLng }) {
    const scale = this._map.getZoomScale(e.zoom);
    const offset = this._map._latLngToNewLayerPoint(this._topLeft, e.zoom, e.center);
    L.DomUtil.setTransform(this._canvas, offset, scale);
  },
  _reset(this: any) {
    const map: L.Map = this._map;
    if (!map) return;
    const size = map.getSize();
    const topLeft = map.containerPointToLayerPoint([0, 0]);
    this._topLeft = map.layerPointToLatLng(topLeft);
    L.DomUtil.setPosition(this._canvas, topLeft);
    const dpr = window.devicePixelRatio || 1;
    this._canvas.width = size.x * dpr;
    this._canvas.height = size.y * dpr;
    this._canvas.style.width = `${size.x}px`;
    this._canvas.style.height = `${size.y}px`;
    this._redraw();
  },
  _redraw(this: any) {
    const map: L.Map = this._map;
    if (!map) return;
    const opts: FogOptions = this.options;
    const size = map.getSize();
    const dpr = window.devicePixelRatio || 1;
    const ctx: CanvasRenderingContext2D = this._canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.x, size.y);

    ctx.globalAlpha = opts.opacity;
    ctx.fillStyle = opts.color;
    ctx.fillRect(0, 0, size.x, size.y);
    ctx.globalAlpha = 1;

    ctx.globalCompositeOperation = "destination-out";
    for (const r of opts.getReveals()) {
      const p = map.latLngToContainerPoint([r.lat, r.lon]);
      const radius = pixelRadius(map, r, opts.radiusMiles);
      if (radius <= 0) continue;
      const grad = ctx.createRadialGradient(p.x, p.y, radius * 0.55, p.x, p.y, radius);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }
});

function FogReveal({ enabled, reveals }: { enabled: boolean; reveals: LatLon[] }) {
  const map = useMap();
  const layerRef = useRef<(L.Layer & { _reset: () => void }) | null>(null);
  const revealsRef = useRef<LatLon[]>(reveals);
  revealsRef.current = reveals;

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const color = isDark ? "#01040a" : "#0c1f15";
  const opacity = isDark ? 0.72 : 0.82;

  useEffect(() => {
    if (!enabled) return;
    const layer = new FogLayerClass({
      getReveals: () => revealsRef.current,
      radiusMiles: REVEAL_RADIUS_MILES,
      color,
      opacity
    }) as L.Layer & { _reset: () => void };
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [enabled, map, color, opacity]);

  useEffect(() => {
    layerRef.current?._reset();
  }, [reveals]);

  return null;
}

function JourneyLine({ enabled, journey }: { enabled: boolean; journey: [number, number][] }) {
  const map = useMap();
  const lineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (lineRef.current) {
      map.removeLayer(lineRef.current);
      lineRef.current = null;
    }
    if (!enabled || journey.length < 2) return;
    const line = L.polyline(journey, {
      color: "#9fe1cb",
      weight: 2,
      opacity: 0.75,
      dashArray: "5 7",
      interactive: false,
      pane: "shadowPane"
    });
    line.addTo(map);
    lineRef.current = line;
    return () => {
      map.removeLayer(line);
      lineRef.current = null;
    };
  }, [enabled, journey, map]);

  return null;
}

function MonumentLayer({ monuments, onSelect }: { monuments: Park[]; onSelect: (m: Park) => void }) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      layerRef.current?.remove();
      layerRef.current = null;
      markersRef.current.clear();
    };
  }, [map]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const markers = markersRef.current;
    const newCodes = new Set(monuments.map((m) => m.parkCode));

    for (const [code, marker] of markers) {
      if (!newCodes.has(code)) {
        layer.removeLayer(marker);
        markers.delete(code);
      }
    }

    for (const m of monuments) {
      if (markers.has(m.parkCode)) continue;
      if (Number.isNaN(m.latitude) || Number.isNaN(m.longitude)) continue;
      const marker = L.marker([m.latitude, m.longitude], { icon: makeMonumentIcon() });
      marker.bindTooltip(m.fullName, { direction: "top", offset: [0, -8] });
      marker.addTo(layer);
      markers.set(m.parkCode, marker);
    }
  }, [monuments]);

  useEffect(() => {
    for (const [code, marker] of markersRef.current) {
      const monument = monuments.find((m) => m.parkCode === code);
      if (!monument) continue;
      marker.off("click");
      marker.on("click", () => onSelect(monument));
    }
  }, [monuments, onSelect]);

  return null;
}

function PinLayer({
  parks,
  statusOf,
  onSelect,
  fogEnabled,
  reveals
}: {
  parks: Park[];
  statusOf: (code: string) => Status;
  onSelect: (p: Park) => void;
  fogEnabled: boolean;
  reveals: LatLon[];
}) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      layerRef.current?.remove();
      layerRef.current = null;
      markersRef.current.clear();
    };
  }, [map]);

  // Add/remove markers when the parks list changes
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const markers = markersRef.current;
    const newCodes = new Set(parks.map((p) => p.parkCode));

    for (const [code, marker] of markers) {
      if (!newCodes.has(code)) {
        layer.removeLayer(marker);
        markers.delete(code);
      }
    }

    for (const p of parks) {
      if (markers.has(p.parkCode)) continue;
      if (Number.isNaN(p.latitude) || Number.isNaN(p.longitude)) continue;
      const revealed = isRevealed(p, fogEnabled, reveals, statusOf);
      const marker = L.marker([p.latitude, p.longitude], { icon: makeIcon(statusOf(p.parkCode), !revealed) });
      marker.addTo(layer);
      markers.set(p.parkCode, marker);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parks, map]);

  // Update click handlers whenever onSelect changes
  useEffect(() => {
    for (const [code, marker] of markersRef.current) {
      const park = parks.find((p) => p.parkCode === code);
      if (!park) continue;
      marker.off("click");
      marker.on("click", () => onSelect(park));
    }
  }, [parks, onSelect]);

  // Icon + tooltip reflect status AND fog reveal state
  useEffect(() => {
    for (const [code, marker] of markersRef.current) {
      const park = parks.find((p) => p.parkCode === code);
      if (!park) continue;
      const revealed = isRevealed(park, fogEnabled, reveals, statusOf);
      marker.setIcon(makeIcon(statusOf(code), !revealed));
      marker.unbindTooltip();
      if (revealed) {
        marker.bindTooltip(park.fullName, { direction: "top", offset: [0, -8] });
      } else {
        marker.bindTooltip("Unexplored — visit a nearby park to reveal", {
          direction: "top",
          offset: [0, -6]
        });
      }
    }
  }, [parks, statusOf, fogEnabled, reveals]);

  return null;
}

export default function ParkMap({
  parks,
  statusOf,
  onSelect,
  monuments,
  onSelectMonument,
  fogEnabled = false,
  reveals = [],
  journey = []
}: {
  parks: Park[];
  statusOf: (code: string) => Status;
  onSelect: (p: Park) => void;
  monuments?: Park[];
  onSelectMonument?: (m: Park) => void;
  fogEnabled?: boolean;
  reveals?: LatLon[];
  journey?: [number, number][];
}) {
  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      minZoom={2}
      maxZoom={12}
      scrollWheelZoom
      className="h-full w-full"
      worldCopyJump
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FogReveal enabled={fogEnabled} reveals={reveals} />
      <JourneyLine enabled={fogEnabled} journey={journey} />
      <PinLayer parks={parks} statusOf={statusOf} onSelect={onSelect} fogEnabled={fogEnabled} reveals={reveals} />
      {monuments && onSelectMonument && (
        <MonumentLayer monuments={monuments} onSelect={onSelectMonument} />
      )}
    </MapContainer>
  );
}
