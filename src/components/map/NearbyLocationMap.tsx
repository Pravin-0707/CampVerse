import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Compass, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { LatLngBoundsExpression } from "leaflet";

const CENTER = {
  lat: 10.9358,
  lng: 76.9552,
};

const RADIUS_METERS = 600;
const EARTH_RADIUS_METERS = 6378137;

function getBoundsForRadius(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
): LatLngBoundsExpression {
  const latOffset = (radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const lngOffset =
    ((radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI)) /
    Math.cos((centerLat * Math.PI) / 180);

  return [
    [centerLat - latOffset, centerLng - lngOffset],
    [centerLat + latOffset, centerLng + lngOffset],
  ];
}

function MapBoundsController({
  bounds,
  leafletReact,
}: {
  bounds: LatLngBoundsExpression;
  leafletReact: typeof import("react-leaflet");
}) {
  const { useMap } = leafletReact;
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, { padding: [36, 36] });
    map.setMaxBounds(bounds);
  }, [bounds, map]);

  return null;
}

export function NearbyLocationMap({ height = "h-[680px]" }: { height?: string }) {
  const [leafletLib, setLeafletLib] = useState<typeof import("leaflet") | null>(null);
  const [leafletReact, setLeafletReact] = useState<typeof import("react-leaflet") | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([import("leaflet"), import("react-leaflet")])
      .then(([leafletModule, reactLeafletModule]) => {
        if (!active) return;
        setLeafletLib(leafletModule);
        setLeafletReact(reactLeafletModule);
      })
      .catch((error) => {
        console.error("Failed to load map modules", error);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!leafletLib || !leafletReact) {
    return (
      <div
        className={`relative ${height} w-full rounded-2xl glass-strong flex items-center justify-center`}
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading nearby map…</span>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup } = leafletReact;
  const fittedBounds = getBoundsForRadius(CENTER.lat, CENTER.lng, RADIUS_METERS);

  return (
    <div
      className={`relative ${height} w-full rounded-2xl overflow-hidden glass-strong border border-border/40`}
    >
      <div className="absolute top-4 left-4 z-20 max-w-sm rounded-2xl border border-border/50 bg-background/85 px-4 py-3 backdrop-blur shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <Compass className="h-3.5 w-3.5 text-primary" />
          2D Area Map
        </div>
        <div className="mt-2 text-sm font-semibold text-foreground">
          600m radius around the campus academic blocks
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {CENTER.lat.toFixed(7)}, {CENTER.lng.toFixed(7)}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2">
        <div className="rounded-full border border-border/50 bg-background/85 px-3 py-1.5 text-[11px] font-medium text-foreground backdrop-blur shadow-lg">
          <span className="text-muted-foreground">Radius:</span> 600m
        </div>
        <div className="rounded-full border border-border/50 bg-background/85 px-3 py-1.5 text-[11px] font-medium text-foreground backdrop-blur shadow-lg">
          <span className="text-muted-foreground">Area:</span> constrained view
        </div>
      </div>

      <MapContainer
        center={[CENTER.lat, CENTER.lng]}
        zoom={16}
        minZoom={14}
        maxZoom={19}
        maxBounds={fittedBounds}
        maxBoundsViscosity={1}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        <MapBoundsController bounds={fittedBounds} leafletReact={leafletReact} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[CENTER.lat, CENTER.lng]}
          radius={8}
          pathOptions={{ color: "#38bdf8", weight: 3, fillColor: "#0f172a", fillOpacity: 1 }}
        >
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold">Center point</div>
              <div>Administrative Block - SKCET</div>
              <div className="text-xs text-muted-foreground">600m radius coverage</div>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-none absolute right-4 bottom-4 z-20 rounded-xl border border-border/50 bg-background/85 px-3 py-2 text-[11px] text-muted-foreground backdrop-blur shadow-lg"
      >
        Visible area is clipped to the 600m neighborhood window.
      </motion.div>
    </div>
  );
}
