"use client";

import { MapContainer, TileLayer, Polygon, Tooltip } from "react-leaflet";
import type { AreaRecord } from "../data/areas";
import { computeReadiness, scoreColor, type WeightProfile } from "../lib/scoring";

type MapViewProps = {
  areas: AreaRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
  weights?: WeightProfile;
};

export default function MapView({
  areas,
  selectedId,
  onSelect,
  weights,
}: MapViewProps) {
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
        const score = computeReadiness(area, weights);
        const isSelected = area.id === selectedId;
        const baseColor = scoreColor(score);
        return (
          <Polygon
            key={area.id}
            positions={area.polygon}
            pathOptions={{
              color: isSelected ? "#0f6b5b" : baseColor,
              fillColor: isSelected ? "#0f6b5b" : baseColor,
              fillOpacity: isSelected ? 0.45 : 0.3,
              weight: isSelected ? 2 : 1,
            }}
            eventHandlers={{
              click: () => onSelect(area.id),
              mouseover: (event) => event.target.setStyle({ fillOpacity: 0.6 }),
              mouseout: (event) =>
                event.target.setStyle({
                  fillOpacity: isSelected ? 0.45 : 0.3,
                }),
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
          </Polygon>
        );
      })}
    </MapContainer>
  );
}
