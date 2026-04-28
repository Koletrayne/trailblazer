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

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
    const layer = layerRef.current;
    layer.clearLayers();
    parks.forEach((p) => {
      if (Number.isNaN(p.latitude) || Number.isNaN(p.longitude)) return;
      const marker = L.marker([p.latitude, p.longitude], { icon: makeIcon(statusOf(p.parkCode)) });
      marker.on("click", () => onSelect(p));
      marker.bindTooltip(p.fullName, { direction: "top", offset: [0, -8] });
      marker.addTo(layer);
    });
    return () => {
      layer.clearLayers();
    };
  }, [parks, statusOf, onSelect, map]);

  return null;
}

export default function ParkMap({
  parks,
  statusOf,
  onSelect
}: {
  parks: Park[];
  statusOf: (code: string) => Status;
  onSelect: (p: Park) => void;
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
    </MapContainer>
  );
}
