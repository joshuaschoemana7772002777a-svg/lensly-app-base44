import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const AREA_COORDS = {
  "Sandton": [-26.1076, 28.0567],
  "Johannesburg": [-26.2041, 28.0473],
  "Pretoria": [-25.7479, 28.2293],
  "Cape Town": [-33.9249, 18.4241],
};

export default function MapView({ creators }) {
  // Collect all unique areas from creators to determine center
  const allAreas = [...new Set(creators.flatMap(c => c.service_areas || []))];
  const centerArea = allAreas[0] || "Johannesburg";
  const center = AREA_COORDS[centerArea] || [-26.2041, 28.0473];
  const zoom = allAreas.includes("Cape Town") && allAreas.some(a => a !== "Cape Town") ? 6 : 11;

  // Group creators by area
  const creatorsByArea = {};
  creators.forEach((c) => {
    (c.service_areas || []).forEach((area) => {
      if (!creatorsByArea[area]) creatorsByArea[area] = [];
      creatorsByArea[area].push(c);
    });
  });

  return (
    <div className="rounded-2xl overflow-hidden border border-neutral-200 shadow-sm" style={{ height: "280px" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {Object.entries(creatorsByArea).map(([area, areaCreators]) => {
          const coords = AREA_COORDS[area];
          if (!coords) return null;
          return (
            <Marker key={area} position={coords}>
              <Popup>
                <div className="text-sm">
                  <strong>{area}</strong>
                  <div className="text-neutral-500 mt-1">{areaCreators.length} creator{areaCreators.length > 1 ? "s" : ""}</div>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {areaCreators.slice(0, 5).map((c) => (
                      <Link
                        key={c.id}
                        to={createPageUrl("CreatorProfile") + `?id=${c.id}`}
                        className="block text-amber-700 hover:underline text-xs"
                      >
                        {c.display_name}
                      </Link>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}