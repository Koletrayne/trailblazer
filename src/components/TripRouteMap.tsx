"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { Park } from "@/types";

function numberedIcon(n: number) {
  return L.divIcon({
    html: `<div style="
      width: 28px; height: 28px;
      border-radius: 50%;
      background: #2f5b35;
      color: white;
      font-weight: 700;
      font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    ">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    className: "tb-trip-marker"
  });
}

function RouteLayer({ parks }: { parks: Park[] }) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
    const layer = layerRef.current;
    layer.clearLayers();

    const coords: L.LatLngTuple[] = [];
    parks.forEach((p, i) => {
      if (Number.isNaN(p.latitude) || Number.isNaN(p.longitude)) return;
      const ll: L.LatLngTuple = [p.latitude, p.longitude];
      coords.push(ll);
      L.marker(ll, { icon: numberedIcon(i + 1) })
        .bindTooltip(`${i + 1}. ${p.fullName}`, { direction: "top", offset: [0, -14] })
        .addTo(layer);
    });

    if (coords.length >= 2) {
      L.polyline(coords, {
        color: "#3f7345",
        weight: 3,
        opacity: 0.85,
        dashArray: "6 6"
      }).addTo(layer);
    }

    if (coords.length === 1) {
      map.setView(coords[0], 6);
    } else if (coords.length >= 2) {
      map.fitBounds(L.latLngBounds(coords), { padding: [30, 30], maxZoom: 7 });
    }

    return () => {
      layer.clearLayers();
    };
  }, [parks, map]);

  return null;
}

export default function TripRouteMap({ parks }: { parks: Park[] }) {
  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={3}
      minZoom={2}
      maxZoom={10}
      scrollWheelZoom={false}
      className="h-64 w-full rounded-lg"
      worldCopyJump
    >
      <TileLayer
        attribution='&copy; OSM'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RouteLayer parks={parks} />
    </MapContainer>
  );
}
