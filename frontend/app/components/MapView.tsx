"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import type { AreaRecord } from "../data/areas";
import { computeReadiness } from "../lib/scoring";

type MapViewProps = {
  areas: AreaRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function MapView({ areas, selectedId, onSelect }: MapViewProps) {
  return (
    <MapContainer
      center={[45.405, -75.69]}
      zoom={12}
      className="h-[420px] w-full rounded-2xl border border-[var(--line)] shadow-sm"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {areas.map((area) => {
        const score = computeReadiness(area);
        const isSelected = area.id === selectedId;
        return (
          <CircleMarker
            key={area.id}
            center={area.center}
            radius={isSelected ? 14 : 10}
            pathOptions={{
              color: isSelected ? "#0f6b5b" : "#1d3f3f",
              fillColor: isSelected ? "#0f6b5b" : "#7fb7a8",
              fillOpacity: isSelected ? 0.9 : 0.65,
              weight: isSelected ? 2 : 1,
            }}
            eventHandlers={{
              click: () => onSelect(area.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <div className="text-xs">
                <div className="font-semibold">{area.name}</div>
                <div>Readiness: {score}</div>
                <div className="text-[11px] text-slate-600">
                  {area.main_constraint}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
