"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { Park, Status } from "@/types";

const STATUS_COLOR: Record<Status, string> = {
  not_visited: "#8b8378",
  wishlist: "#d4a437",
  planned: "#3b7bd0",
  visited: "#3f7345"
};

function makeIcon(status: Status) {
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

function MonumentLayer({
  monuments,
  onSelect
}: {
  monuments: Park[];
  onSelect: (m: Park) => void;
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
  onSelect
}: {
  parks: Park[];
  statusOf: (code: string) => Status;
  onSelect: (p: Park) => void;
}) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize layer once
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

    // Remove markers no longer in the filtered list
    for (const [code, marker] of markers) {
      if (!newCodes.has(code)) {
        layer.removeLayer(marker);
        markers.delete(code);
      }
    }

    // Add markers for newly visible parks
    for (const p of parks) {
      if (markers.has(p.parkCode)) continue;
      if (Number.isNaN(p.latitude) || Number.isNaN(p.longitude)) continue;
      const marker = L.marker([p.latitude, p.longitude], { icon: makeIcon(statusOf(p.parkCode)) });
      marker.bindTooltip(p.fullName, { direction: "top", offset: [0, -8] });
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

  // Update icons in-place when status changes — no flash, no clear
  useEffect(() => {
    for (const [code, marker] of markersRef.current) {
      marker.setIcon(makeIcon(statusOf(code)));
    }
  }, [statusOf]);

  return null;
}

export default function ParkMap({
  parks,
  statusOf,
  onSelect,
  monuments,
  onSelectMonument
}: {
  parks: Park[];
  statusOf: (code: string) => Status;
  onSelect: (p: Park) => void;
  monuments?: Park[];
  onSelectMonument?: (m: Park) => void;
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
      <PinLayer parks={parks} statusOf={statusOf} onSelect={onSelect} />
      {monuments && onSelectMonument && (
        <MonumentLayer monuments={monuments} onSelect={onSelectMonument} />
      )}
    </MapContainer>
  );
}
