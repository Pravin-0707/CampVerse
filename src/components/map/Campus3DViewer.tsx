import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Compass,
  Layers3,
  Loader2,
  LocateFixed,
  Route as RouteIcon,
  AlertTriangle,
  Crosshair,
  Navigation as NavIcon,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { LatLngBoundsExpression, LatLngLiteral } from "leaflet";
import type { WalkwayRouteResult } from "@/lib/walkway-routing";
import { VERIFIED_CAMPUS_LOCATIONS } from "@/lib/campus-locations";

const CAMPUS_CENTER = { lat: 10.9358, lng: 76.9552 };

export interface LiveGPSUserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  heading?: number | null;
  timestamp?: number;
}

function buildBounds(points: Array<{ lat: number; lng: number }>): LatLngBoundsExpression {
  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lng);
  return [
    [Math.min(...latitudes), Math.min(...longitudes)],
    [Math.max(...latitudes), Math.max(...longitudes)],
  ];
}

function MapBoundsController({
  bounds,
  leafletReact,
  isNavigating,
}: {
  bounds: LatLngBoundsExpression;
  leafletReact: typeof import("react-leaflet");
  isNavigating?: boolean;
}) {
  const { useMap } = leafletReact;
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (!hasFitted.current && !isNavigating) {
      map.fitBounds(bounds, { padding: [36, 36] });
      hasFitted.current = true;
    }
  }, [bounds, map, isNavigating]);

  return null;
}

function MapCenterOnUserController({
  userLocation,
  trigger,
  leafletReact,
}: {
  userLocation: LiveGPSUserLocation | null;
  trigger: number;
  leafletReact: typeof import("react-leaflet");
}) {
  const { useMap } = leafletReact;
  const map = useMap();

  useEffect(() => {
    if (trigger > 0 && userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 17), {
        animate: true,
        duration: 0.8,
      });
    }
  }, [trigger, userLocation, map]);

  return null;
}

function MapClickSelector({
  leafletReact,
  onSelect,
  selectionMode,
}: {
  leafletReact: typeof import("react-leaflet");
  onSelect: (location: LatLngLiteral) => void;
  selectionMode?: "start" | "target" | null;
}) {
  const { useMapEvents } = leafletReact;
  const map = leafletReact.useMap();

  useMapEvents({
    click: (event) => {
      const location = { lat: event.latlng.lat, lng: event.latlng.lng };
      const label = selectionMode === "start" ? "Selected Starting Point" : "Selected Destination";
      map.openPopup(
        `<strong>${label}</strong><br/><span>${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</span>`,
        event.latlng,
      );
      onSelect(location);
    },
  });
  return null;
}

export function Campus3DViewer({
  height = "h-[600px]",
  label = "Campus Walkway Map",
  startLocation,
  targetLocation,
  route,
  routeError,
  walkwayData: externalWalkwayData,
  selectionMode,
  onMapLocationSelect,
  userLocation,
  isNavigating = false,
  isOffWalkway = false,
  isOffRoute = false,
  centerTrigger = 0,
  onCenterOnMe,
}: {
  height?: string;
  label?: string;
  startLocation?: LatLngLiteral | null;
  targetLocation?: LatLngLiteral | null;
  route?: WalkwayRouteResult | null;
  routeError?: string | null;
  walkwayData?: any;
  selectionMode?: "start" | "target" | null;
  onMapLocationSelect?: (location: LatLngLiteral) => void;
  userLocation?: LiveGPSUserLocation | null;
  isNavigating?: boolean;
  isOffWalkway?: boolean;
  isOffRoute?: boolean;
  centerTrigger?: number;
  onCenterOnMe?: () => void;
}) {
  const [leafletReact, setLeafletReact] = useState<typeof import("react-leaflet") | null>(null);
  const [internalWalkwayData, setInternalWalkwayData] = useState<any | null>(null);

  useEffect(() => {
    let active = true;

    import("react-leaflet")
      .then((module) => {
        if (!active) return;
        setLeafletReact(module);
      })
      .catch((error) => {
        console.error("Failed to load Leaflet map modules", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (externalWalkwayData) return;
    fetch("/maps/campus-walkways.geojson")
      .then((response) => response.json())
      .then(setInternalWalkwayData)
      .catch((error) => console.error("Failed to load campus walkways", error));
  }, [externalWalkwayData]);

  const walkwayData = externalWalkwayData || internalWalkwayData;

  const mapPoints = useMemo(() => {
    const pts: Array<{ lat: number; lng: number }> = [CAMPUS_CENTER];
    if (startLocation) pts.push(startLocation);
    if (targetLocation) pts.push(targetLocation);
    if (userLocation) pts.push({ lat: userLocation.lat, lng: userLocation.lng });
    if (route?.coordinates?.length) {
      pts.push(...route.coordinates);
    }
    return pts;
  }, [startLocation, targetLocation, userLocation, route]);

  const bounds = useMemo(() => buildBounds(mapPoints), [mapPoints]);

  if (!leafletReact) {
    return (
      <div
        className={`relative ${height} w-full rounded-2xl glass-strong flex items-center justify-center`}
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading campus walkway map…</span>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, GeoJSON, Polyline, CircleMarker, Circle, Popup, Tooltip } =
    leafletReact;

  return (
    <div
      className={`relative ${height} w-full rounded-2xl overflow-hidden glass-strong border border-border/40`}
    >
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-background/90 px-3 py-1.5 border border-border/50 backdrop-blur shadow-lg">
          <Compass className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">{label}</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
        </div>

        {isNavigating && (
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 px-2.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur shadow-lg animate-pulse">
            <NavIcon className="h-3.5 w-3.5 text-emerald-400" />
            Live Navigation Active
          </div>
        )}

        <div className="hidden md:flex items-center gap-2 rounded-xl bg-background/90 px-3 py-1.5 border border-border/50 backdrop-blur shadow-lg text-[11px] text-muted-foreground">
          <Layers3 className="h-3.5 w-3.5 text-primary" />
          GeoJSON Walkway Network
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 max-w-[280px]">
        {selectionMode && (
          <div className="rounded-xl border border-primary/60 bg-primary/20 px-3 py-2 text-xs font-semibold text-primary backdrop-blur shadow-lg animate-pulse">
            Click anywhere on the map to place{" "}
            {selectionMode === "start" ? "Starting Point" : "Destination Target"}
          </div>
        )}

        {isOffWalkway && isNavigating && (
          <div className="rounded-xl border border-amber-500/60 bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-200 backdrop-blur shadow-lg flex items-center gap-2 animate-bounce">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>You are off the walkway. Recalculating from nearest path...</span>
          </div>
        )}

        {route && !isOffWalkway && (
          <div
            className={`rounded-xl border px-3 py-2 text-[11px] text-muted-foreground backdrop-blur shadow-lg transition ${
              isNavigating
                ? "border-amber-400/70 bg-background/95 ring-1 ring-amber-400/30"
                : "border-amber-500/40 bg-background/90"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <RouteIcon className="h-3.5 w-3.5 text-amber-400" />
                {isNavigating ? "Live Guided Route" : "Active Walkway Route"}
              </div>
              {isNavigating && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold">
                  LIVE
                </span>
              )}
            </div>
            <div className="mt-1 font-mono text-foreground font-semibold">
              {route.distance} m · {route.minutes} min walk (~70 m/min)
            </div>
          </div>
        )}

        {routeError && (
          <div className="rounded-xl border border-destructive/60 bg-destructive/20 px-3 py-2 text-xs text-destructive-foreground font-medium backdrop-blur shadow-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
            <div>
              <div className="font-semibold text-destructive">No Connected Route</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{routeError}</div>
            </div>
          </div>
        )}
      </div>

      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [36, 36] }}
        minZoom={13}
        maxZoom={20}
        zoom={16}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        <MapBoundsController
          bounds={bounds}
          leafletReact={leafletReact}
          isNavigating={isNavigating}
        />
        <MapCenterOnUserController
          userLocation={userLocation || null}
          trigger={centerTrigger}
          leafletReact={leafletReact}
        />

        {selectionMode && onMapLocationSelect && (
          <MapClickSelector
            leafletReact={leafletReact}
            onSelect={onMapLocationSelect}
            selectionMode={selectionMode}
          />
        )}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {walkwayData && (
          <GeoJSON
            key={JSON.stringify(walkwayData.features?.length)}
            data={walkwayData}
            filter={(feature: any) => feature.geometry?.type === "LineString"}
            style={() => ({
              color: "#0284c7",
              weight: 2.5,
              opacity: 0.45,
              dashArray: "4 6",
            })}
          />
        )}

        {route && route.coordinates.length > 1 && (
          <>
            {isNavigating && (
              <Polyline
                positions={route.coordinates.map((p) => [p.lat, p.lng])}
                pathOptions={{
                  color: "#eab308",
                  weight: 12,
                  opacity: 0.35,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            )}
            <Polyline
              positions={route.coordinates.map((p) => [p.lat, p.lng])}
              pathOptions={{
                color: "#facc15",
                weight: isNavigating ? 7 : 7,
                opacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}

        {/* Verified Named Campus Locations */}
        {VERIFIED_CAMPUS_LOCATIONS.map((loc) => {
          const isSelectedStart =
            startLocation &&
            Math.abs(startLocation.lat - loc.lat) < 0.0001 &&
            Math.abs(startLocation.lng - loc.lng) < 0.0001;
          const isSelectedTarget =
            targetLocation &&
            Math.abs(targetLocation.lat - loc.lat) < 0.0001 &&
            Math.abs(targetLocation.lng - loc.lng) < 0.0001;
          if (isSelectedStart || isSelectedTarget) return null; // Avoid duplicate marker over selected point

          return (
            <CircleMarker
              key={loc.id}
              center={[loc.lat, loc.lng]}
              radius={7}
              pathOptions={{
                color: "#0f172a",
                fillColor:
                  loc.type === "gate" ? "#f59e0b" : loc.type === "facility" ? "#06b6d4" : "#8b5cf6",
                fillOpacity: 0.95,
                weight: 2,
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -6]}
                opacity={0.9}
                className="custom-campus-tooltip"
              >
                <span className="font-semibold text-[11px] text-foreground">{loc.name}</span>
              </Tooltip>
              <Popup>
                <div className="text-xs font-sans space-y-1">
                  <strong className="block text-primary font-bold">{loc.name}</strong>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                  </div>
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                    {loc.type}
                  </div>
                  {onMapLocationSelect && (
                    <div className="mt-2 flex gap-1.5 pt-1 border-t border-border/40">
                      <button
                        type="button"
                        onClick={() => onMapLocationSelect({ lat: loc.lat, lng: loc.lng })}
                        className="px-2 py-0.5 rounded bg-primary/20 hover:bg-primary/30 text-[10px] font-semibold text-primary transition"
                      >
                        Select Location
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {startLocation && (
          <CircleMarker
            center={[startLocation.lat, startLocation.lng]}
            radius={8}
            pathOptions={{
              color: "#15803d",
              fillColor: "#22c55e",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong className="text-emerald-600 block font-bold">Starting Point</strong>
                <span>
                  {startLocation.lat.toFixed(6)}, {startLocation.lng.toFixed(6)}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {targetLocation && (
          <CircleMarker
            center={[targetLocation.lat, targetLocation.lng]}
            radius={8}
            pathOptions={{
              color: "#b91c1c",
              fillColor: "#ef4444",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong className="text-rose-600 block font-bold">Destination Target</strong>
                <span>
                  {targetLocation.lat.toFixed(6)}, {targetLocation.lng.toFixed(6)}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {route?.debug?.snapStart && (
          <CircleMarker
            center={[route.debug.snapStart.lat, route.debug.snapStart.lng]}
            radius={4}
            pathOptions={{
              color: "#16a34a",
              fillColor: "#86efac",
              fillOpacity: 0.9,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong>Snapped Start on Walkway</strong>
                <div>Walkway connector: {route.debug.startDistToWalkway} m</div>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {route?.debug?.snapTarget && (
          <CircleMarker
            center={[route.debug.snapTarget.lat, route.debug.snapTarget.lng]}
            radius={4}
            pathOptions={{
              color: "#dc2626",
              fillColor: "#fca5a5",
              fillOpacity: 0.9,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong>Snapped Destination on Walkway</strong>
                <div>Walkway connector: {route.debug.targetDistToWalkway} m</div>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {userLocation && (
          <>
            {userLocation.accuracy > 0 && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={Math.max(userLocation.accuracy, 4)}
                pathOptions={{
                  color: isOffWalkway ? "#f59e0b" : "#3b82f6",
                  fillColor: isOffWalkway ? "#fbbf24" : "#60a5fa",
                  fillOpacity: 0.12,
                  weight: 1,
                  dashArray: "3 3",
                }}
              />
            )}

            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={14}
              pathOptions={{
                color: isOffWalkway ? "#f59e0b" : "#2563eb",
                fillColor: isOffWalkway ? "#f59e0b" : "#3b82f6",
                fillOpacity: 0.25,
                weight: 2,
              }}
            />

            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                fillColor: isOffWalkway ? "#f59e0b" : "#2563eb",
                fillOpacity: 1,
                weight: 2.5,
              }}
            >
              <Popup>
                <div className="text-xs font-sans">
                  <div className="font-bold flex items-center gap-1 text-primary">
                    <Crosshair className="h-3.5 w-3.5" /> Live GPS Position
                  </div>
                  <div className="text-muted-foreground font-mono mt-1 text-[11px]">
                    Lat: {userLocation.lat.toFixed(6)}
                    <br />
                    Lng: {userLocation.lng.toFixed(6)}
                  </div>
                  <div className="mt-1 text-[11px]">
                    Accuracy: ±{Math.round(userLocation.accuracy)} m
                  </div>
                  {isOffWalkway && (
                    <div className="mt-1 text-amber-500 font-bold">⚠ Off walkway network</div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}
      </MapContainer>

      <div className="absolute left-4 bottom-4 z-20 flex items-center gap-2">
        {userLocation && (
          <button
            type="button"
            onClick={onCenterOnMe}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/50 bg-background/95 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/15 transition shadow-lg backdrop-blur"
          >
            <Crosshair className="h-4 w-4" />
            Center on me
          </button>
        )}
      </div>
    </div>
  );
}
