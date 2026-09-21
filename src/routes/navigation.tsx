import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { Campus3DViewer, type LiveGPSUserLocation } from "@/components/map/Campus3DViewer";
import {
  Volume2,
  MapPin,
  Navigation as NavIcon,
  Compass,
  Bug,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Play,
  Square,
  Crosshair,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Footprints,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VERIFIED_CAMPUS_LOCATIONS, findNearbyVerifiedLocation } from "@/lib/campus-locations";
import {
  buildWalkwayGraph,
  findWalkwayRoute,
  haversine,
  calculateNavigationProgress,
  type GeoPoint,
  type WalkwayGraph,
  type WalkwayRouteResult,
} from "@/lib/walkway-routing";
import { toast } from "sonner";
import type { LatLngLiteral } from "leaflet";

export const Route = createFileRoute("/navigation")({ component: NavigationPage });

// Verified campus test routes using real SKCET coordinates
const QUICK_ROUTES = [
  {
    name: "Admin → Library",
    startName: "Admin Block",
    start: { lat: 10.937722, lng: 76.956301 },
    targetName: "Library / Vankatram Learning Centre",
    target: { lat: 10.938559, lng: 76.956052 },
  },
  {
    name: "Library → Food Court",
    startName: "Library / Vankatram Learning Centre",
    start: { lat: 10.938559, lng: 76.956052 },
    targetName: "Food Court",
    target: { lat: 10.938755, lng: 76.956653 },
  },
  {
    name: "C1 → CSE/IT",
    startName: "C1 Block",
    start: { lat: 10.937196, lng: 76.956258 },
    targetName: "CSE / IT Block",
    target: { lat: 10.936688, lng: 76.956629 },
  },
  {
    name: "EEE → Mechanical",
    startName: "EEE Block",
    start: { lat: 10.936673, lng: 76.956219 },
    targetName: "Mechanical Block",
    target: { lat: 10.935967, lng: 76.956414 },
  },
  {
    name: "Civil → ECE",
    startName: "Civil Block",
    start: { lat: 10.936304, lng: 76.955839 },
    targetName: "ECE Block",
    target: { lat: 10.936326, lng: 76.956346 },
  },
  {
    name: "Convention → Bike Parking",
    startName: "Convention Center",
    start: { lat: 10.938241, lng: 76.956599 },
    targetName: "Bike Parking",
    target: { lat: 10.936986, lng: 76.954976 },
  },
  {
    name: "MBA → MCA",
    startName: "MBA Block",
    start: { lat: 10.937504, lng: 76.955711 },
    targetName: "MCA Block",
    target: { lat: 10.937186, lng: 76.955895 },
  },
  {
    name: "Same walkway",
    startName: "Walkway Point A",
    start: { lat: 10.938114, lng: 76.955985 },
    targetName: "Walkway Point B",
    target: { lat: 10.936121, lng: 76.956043 },
  },
];

function NavigationPage() {
  const [walkwayData, setWalkwayData] = useState<any | null>(null);
  const [toleranceMeters, setToleranceMeters] = useState<number>(5);
  const [walkingSpeedMpm, setWalkingSpeedMpm] = useState<number>(70);

  const [startName, setStartName] = useState<string>("Admin Block");
  const [targetName, setTargetName] = useState<string>("Library / Vankatram Learning Centre");
  const [startLocation, setStartLocation] = useState<GeoPoint | null>({
    lat: 10.937722,
    lng: 76.956301,
  });
  const [targetLocation, setTargetLocation] = useState<GeoPoint | null>({
    lat: 10.938559,
    lng: 76.956052,
  });
  const [selectionMode, setSelectionMode] = useState<"start" | "target" | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(true);

  // Live GPS navigation states
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "tracking" | "denied" | "unavailable" | "timeout"
  >("idle");
  const [userLocation, setUserLocation] = useState<LiveGPSUserLocation | null>(null);
  const [lastRoutedLocation, setLastRoutedLocation] = useState<GeoPoint | null>(null);
  const [centerTrigger, setCenterTrigger] = useState<number>(0);
  const [simIndex, setSimIndex] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load GeoJSON once
  useEffect(() => {
    fetch("/maps/campus-walkways.geojson")
      .then((res) => res.json())
      .then((data) => setWalkwayData(data))
      .catch((err) => {
        console.error("Failed to load campus walkways", err);
        toast.error("Failed to load campus walkways GeoJSON");
      });
  }, []);

  // Build topological graph from GeoJSON LineStrings
  const graph: WalkwayGraph | null = useMemo(() => {
    if (!walkwayData) return null;
    return buildWalkwayGraph(walkwayData, toleranceMeters);
  }, [walkwayData, toleranceMeters]);

  // Determine active routing origin (live user location if navigating, else selected start)
  const activeOrigin: GeoPoint | null = useMemo(() => {
    if (isNavigating && userLocation) {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }
    return startLocation;
  }, [isNavigating, userLocation, startLocation]);

  // Compute A* route across GeoJSON walkway network
  const routeResult: WalkwayRouteResult | null = useMemo(() => {
    if (!graph || !activeOrigin || !targetLocation) return null;
    return findWalkwayRoute(graph, activeOrigin, targetLocation, {
      walkingSpeedMpm,
      toleranceMeters,
    });
  }, [graph, activeOrigin, targetLocation, walkingSpeedMpm, toleranceMeters]);

  // Live navigation progress and off-route analysis
  const navProgress = useMemo(() => {
    if (!userLocation || !routeResult || !graph) return null;
    return calculateNavigationProgress(graph, userLocation, routeResult, walkingSpeedMpm);
  }, [userLocation, routeResult, graph, walkingSpeedMpm]);

  const routeError = useMemo(() => {
    if (!activeOrigin || !targetLocation) return null;
    if (!graph) return "Loading walkway graph...";
    if (!routeResult)
      return "No connected GeoJSON walkway route exists between selected locations.";
    return null;
  }, [activeOrigin, targetLocation, graph, routeResult]);

  // Clean up GPS watcher and simulator on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
    };
  }, []);

  // Handle GPS location update and 5-meter movement filter
  const handleGPSUpdate = (position: GeolocationPosition) => {
    const loc: LiveGPSUserLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      timestamp: position.timestamp,
    };

    setUserLocation(loc);
    setGpsStatus("tracking");

    // Check if user moved >= 5 meters from last route calculation location
    if (!lastRoutedLocation || haversine(lastRoutedLocation, { lat: loc.lat, lng: loc.lng }) >= 5) {
      setLastRoutedLocation({ lat: loc.lat, lng: loc.lng });
    }
  };

  const handleGPSError = (error: GeolocationPositionError) => {
    console.warn("Geolocation watch error:", error);
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setGpsStatus("denied");
        toast.error("Location permission denied. Please allow access in browser settings.");
        break;
      case error.POSITION_UNAVAILABLE:
        setGpsStatus("unavailable");
        toast.error("Location information unavailable.");
        break;
      case error.TIMEOUT:
        setGpsStatus("timeout");
        toast.error("Location request timed out. Retrying...");
        break;
      default:
        toast.error("Error retrieving location.");
    }
  };

  const startNavigation = () => {
    if (!targetLocation) {
      toast.error("Please select a destination first.");
      return;
    }

    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsNavigating(true);
    toast.info("Requesting live GPS location...");

    // Start continuous watching
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(handleGPSUpdate, handleGPSError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 1000,
    });

    // Initial center trigger
    setCenterTrigger((prev) => prev + 1);
  };

  const stopNavigation = () => {
    if (watchIdRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
      setIsSimulating(false);
    }
    setIsNavigating(false);
    setGpsStatus("idle");
    toast.info("Navigation stopped.");
  };

  // Walk Simulator for testing movement and off-route behavior on desktop
  const toggleWalkSimulation = () => {
    if (!routeResult || routeResult.coordinates.length < 2) {
      toast.error("No active route to simulate.");
      return;
    }

    if (isSimulating) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      simTimerRef.current = null;
      setIsSimulating(false);
      toast.info("Simulation paused.");
    } else {
      setIsNavigating(true);
      setIsSimulating(true);
      let idx = simIndex;
      const coords = routeResult.coordinates;

      simTimerRef.current = setInterval(() => {
        if (idx >= coords.length - 1) {
          if (simTimerRef.current) clearInterval(simTimerRef.current);
          setIsSimulating(false);
          toast.success("Simulation arrived at destination!");
          return;
        }
        idx += 1;
        setSimIndex(idx);
        const currentCoord = coords[idx];
        const simulatedLocation: LiveGPSUserLocation = {
          lat: currentCoord.lat,
          lng: currentCoord.lng,
          accuracy: 8,
          timestamp: Date.now(),
        };
        setUserLocation(simulatedLocation);
        setGpsStatus("tracking");

        if (!lastRoutedLocation || haversine(lastRoutedLocation, currentCoord) >= 5) {
          setLastRoutedLocation(currentCoord);
        }
      }, 1500);
      toast.info("Live walking simulation started along route.");
    }
  };

  const handleTriggerOffRouteDetour = () => {
    if (!userLocation) {
      toast.error("User location is not active.");
      return;
    }
    // Step 35 meters off walkway to test off-route detection & recovery
    const offLoc: LiveGPSUserLocation = {
      lat: userLocation.lat + 0.00032,
      lng: userLocation.lng + 0.00032,
      accuracy: 12,
      timestamp: Date.now(),
    };
    setUserLocation(offLoc);
    setLastRoutedLocation({ lat: offLoc.lat, lng: offLoc.lng });
    toast.warning("Simulated 35m off-walkway detour. Testing recovery...");
  };

  const handleMapLocationSelect = (location: LatLngLiteral) => {
    const nearby = findNearbyVerifiedLocation(location.lat, location.lng, 30);
    const name = nearby
      ? nearby.name
      : `Selected map location (${location.lat.toFixed(5)}, ${location.lng.toFixed(5)})`;

    if (selectionMode === "start") {
      setStartLocation(location);
      setStartName(name);
      toast.success(
        nearby ? `Starting point: ${nearby.name}` : "Starting point set to map coordinate",
      );
    } else if (selectionMode === "target") {
      setTargetLocation(location);
      setTargetName(name);
      toast.success(nearby ? `Destination: ${nearby.name}` : "Destination set to map coordinate");
    }
    setSelectionMode(null);
  };

  const handleApplyQuickRoute = (qr: (typeof QUICK_ROUTES)[0]) => {
    setStartLocation(qr.start);
    setStartName(qr.startName);
    setTargetLocation(qr.target);
    setTargetName(qr.targetName);
    setSelectionMode(null);
    setSimIndex(0);
    toast.info(`Loaded test route: ${qr.name}`);
  };

  const handleVoiceNav = () => {
    if (!routeResult) {
      toast.error("No valid route to navigate");
      return;
    }
    const dist = navProgress ? navProgress.remainingDistanceMeters : routeResult.distance;
    const mins = navProgress ? navProgress.remainingMinutes : routeResult.minutes;
    const text = `Navigating towards ${targetName}. ${dist} meters remaining, estimated arrival in ${mins} minutes.`;
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
      toast.info("Voice navigation started...");
    } else {
      toast.info(text);
    }
  };

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary" /> Live Campus Navigation & Wayfinding
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time GPS tracking with continuous A* walkway routing, accuracy circles, and
            off-route recovery.
          </p>
        </div>

        {/* Quick Test Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Test Routes:
          </span>
          {QUICK_ROUTES.map((qr) => (
            <button
              key={qr.name}
              type="button"
              onClick={() => handleApplyQuickRoute(qr)}
              className="rounded-lg bg-primary/10 border border-primary/30 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition shadow-sm"
            >
              {qr.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-4">
          {/* Navigation Control & Point Selector Card */}
          <GlassCard className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <LocationSearch
                  label="Starting Point / Current Point"
                  value={
                    isNavigating && userLocation
                      ? `Live GPS (${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)})`
                      : startName
                  }
                  onSelect={(loc) => {
                    setStartLocation({ lat: loc.lat, lng: loc.lng });
                    setStartName(loc.name);
                    toast.success(`Starting point: ${loc.name}`);
                  }}
                />
                {!isNavigating && (
                  <button
                    type="button"
                    onClick={() => setSelectionMode(selectionMode === "start" ? null : "start")}
                    className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                      selectionMode === "start"
                        ? "bg-emerald-600 text-white shadow"
                        : "border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {selectionMode === "start" ? "Click map to place start" : "Select start on map"}
                  </button>
                )}
              </div>

              <div>
                <LocationSearch
                  label="Destination Target"
                  value={targetName}
                  onSelect={(loc) => {
                    setTargetLocation({ lat: loc.lat, lng: loc.lng });
                    setTargetName(loc.name);
                    toast.success(`Destination: ${loc.name}`);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSelectionMode(selectionMode === "target" ? null : "target")}
                  className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                    selectionMode === "target"
                      ? "bg-rose-600 text-white shadow"
                      : "border border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {selectionMode === "target"
                    ? "Click map to place destination"
                    : "Select destination on map"}
                </button>
              </div>
            </div>

            {/* Live Navigation Action Controls */}
            <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {!isNavigating ? (
                  <button
                    type="button"
                    onClick={startNavigation}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs font-bold transition shadow-lg"
                  >
                    <Play className="h-4 w-4 fill-current" /> Start Navigation
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopNavigation}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 text-xs font-bold transition shadow-lg"
                  >
                    <Square className="h-4 w-4 fill-current" /> Stop Navigation
                  </button>
                )}

                {/* Simulation button for quick interactive testing */}
                <button
                  type="button"
                  onClick={toggleWalkSimulation}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    isSimulating
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse"
                      : "border-border/60 bg-background/50 hover:bg-background/80 text-muted-foreground"
                  }`}
                >
                  <Footprints className="h-3.5 w-3.5 text-amber-400" />
                  {isSimulating ? "Pause Simulator" : "Simulate Live Walk"}
                </button>

                {isNavigating && (
                  <button
                    type="button"
                    onClick={handleTriggerOffRouteDetour}
                    className="inline-flex items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                  >
                    <AlertTriangle className="h-3 w-3" /> Test Off-Route Detour
                  </button>
                )}
              </div>

              {/* Privacy Consent Indicator */}
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-background/50 border border-border/40 rounded-lg px-2.5 py-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Client memory only · No server storage</span>
              </div>
            </div>
          </GlassCard>

          {/* GPS Accuracy Warning Alert */}
          {userLocation && userLocation.accuracy > 25 && isNavigating && (
            <div className="rounded-xl border border-amber-500/60 bg-amber-500/15 p-3 text-xs text-amber-200 flex items-start gap-2 shadow">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong className="block font-semibold">
                  Low GPS Accuracy (±{Math.round(userLocation.accuracy)} m)
                </strong>
                <span>
                  Your position might be approximate due to indoor interference. Walkway snapping is
                  active.
                </span>
              </div>
            </div>
          )}

          {/* Off-Walkway Notification Banner */}
          {navProgress?.isOffWalkway && isNavigating && (
            <div className="rounded-xl border border-amber-500/70 bg-amber-500/20 p-3.5 text-xs text-amber-100 flex items-center justify-between gap-3 shadow animate-pulse">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-amber-300">
                    You are off the walkway ({navProgress.distToWalkway} m away)
                  </div>
                  <div className="text-[11px] text-amber-200/80">
                    Recalculating A* route from the nearest campus walkway segment.
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-200">
                REROUTING
              </span>
            </div>
          )}

          {/* Interactive Leaflet Map with Live GPS */}
          <Campus3DViewer
            height="h-[520px]"
            label="Campus GeoJSON Walkway Map"
            startLocation={startLocation}
            targetLocation={targetLocation}
            route={routeResult}
            routeError={routeError}
            walkwayData={walkwayData}
            selectionMode={selectionMode}
            onMapLocationSelect={handleMapLocationSelect}
            userLocation={userLocation}
            isNavigating={isNavigating}
            isOffWalkway={navProgress?.isOffWalkway ?? false}
            isOffRoute={navProgress?.isOffRoute ?? false}
            centerTrigger={centerTrigger}
            onCenterOnMe={() => setCenterTrigger((prev) => prev + 1)}
          />

          {/* Live Navigation HUD / Stats Bar */}
          <GlassCard className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <Stat
                  k="Distance Remaining"
                  v={
                    navProgress
                      ? `${navProgress.remainingDistanceMeters} m`
                      : routeResult
                        ? `${routeResult.distance} m`
                        : "--"
                  }
                />
                <Stat
                  k="Estimated Time"
                  v={
                    navProgress
                      ? `${navProgress.remainingMinutes} min`
                      : routeResult
                        ? `${routeResult.minutes} min`
                        : "--"
                  }
                />
                <Stat
                  k="GPS Accuracy"
                  v={
                    userLocation
                      ? `±${Math.round(userLocation.accuracy)} m (${userLocation.accuracy < 15 ? "Good" : userLocation.accuracy < 30 ? "Fair" : "Poor"})`
                      : isNavigating
                        ? "Acquiring..."
                        : "--"
                  }
                />
                <Stat
                  k="Route Status"
                  v={
                    isNavigating
                      ? navProgress?.isOffWalkway
                        ? "Off Walkway"
                        : "Navigating"
                      : routeResult
                        ? "Ready"
                        : "Select points"
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                {userLocation && (
                  <button
                    type="button"
                    onClick={() => setCenterTrigger((prev) => prev + 1)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                  >
                    <Crosshair className="h-3.5 w-3.5" /> Center on me
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowDebug(!showDebug)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    showDebug
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-background/40 border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bug className="h-3.5 w-3.5" />
                  Dev Debug
                  {showDebug ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleVoiceNav}
                  disabled={!routeResult}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary/15 border border-primary/40 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/25 transition shadow disabled:opacity-50"
                >
                  <Volume2 className="h-4 w-4" /> Voice Guidance
                </button>
              </div>
            </div>

            {/* Live Progress Bar along route */}
            {isNavigating && navProgress && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1">
                  <span>Navigation Progress</span>
                  <span className="text-primary font-mono">
                    {navProgress.progressPercent}% Completed
                  </span>
                </div>
                <div className="w-full h-2 bg-background/60 rounded-full overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-yellow-400 transition-all duration-500 rounded-full"
                    style={{ width: `${navProgress.progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </GlassCard>

          {/* Development Debugging Information Panel */}
          <AnimatePresence>
            {showDebug && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard className="p-5 border-amber-500/30 bg-black/40">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase">
                      <Bug className="h-4 w-4" /> Real-time GPS & Graph Inspector
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                      Live A* Walkway Engine
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                    <DebugItem
                      label="Live GPS Lat / Lng"
                      value={
                        userLocation
                          ? `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`
                          : "Not active"
                      }
                    />
                    <DebugItem
                      label="GPS Accuracy"
                      value={userLocation ? `±${userLocation.accuracy.toFixed(1)} meters` : "N/A"}
                    />
                    <DebugItem
                      label="Destination Coords"
                      value={
                        targetLocation
                          ? `${targetLocation.lat.toFixed(6)}, ${targetLocation.lng.toFixed(6)}`
                          : "None"
                      }
                    />
                    <DebugItem
                      label="Snapped Walkway Pt"
                      value={
                        routeResult?.debug?.snapStart
                          ? `${routeResult.debug.snapStart.lat.toFixed(6)}, ${routeResult.debug.snapStart.lng.toFixed(6)} (${routeResult.debug.startDistToWalkway}m)`
                          : "Not snapped"
                      }
                    />
                    <DebugItem
                      label="Dist to Walkway"
                      value={
                        navProgress
                          ? `${navProgress.distToWalkway} meters`
                          : routeResult?.debug?.startDistToWalkway
                            ? `${routeResult.debug.startDistToWalkway} m`
                            : "0 m"
                      }
                      isError={navProgress?.isOffWalkway}
                    />
                    <DebugItem
                      label="Dist to Planned Route"
                      value={navProgress ? `${navProgress.distToRoute} meters` : "0 m"}
                    />
                    <DebugItem
                      label="Remaining Walk Distance"
                      value={
                        navProgress
                          ? `${navProgress.remainingDistanceMeters} meters`
                          : routeResult
                            ? `${routeResult.distance} meters`
                            : "--"
                      }
                    />
                    <DebugItem
                      label="Remaining Walk Time"
                      value={
                        navProgress
                          ? `${navProgress.remainingMinutes} min (@ 70 m/min)`
                          : routeResult
                            ? `${routeResult.minutes} min`
                            : "--"
                      }
                    />
                    <DebugItem
                      label="5m Movement Recalc"
                      value={
                        lastRoutedLocation
                          ? `Last at (${lastRoutedLocation.lat.toFixed(5)}, ${lastRoutedLocation.lng.toFixed(5)})`
                          : "Ready"
                      }
                    />
                    <DebugItem
                      label="Nearest Walkway Segment"
                      value={
                        routeResult?.debug?.nearestStartSegment
                          ? `Edge #${routeResult.debug.nearestStartSegment.edgeId} (${Math.round(routeResult.debug.nearestStartSegment.distance)}m)`
                          : "None"
                      }
                    />
                    <DebugItem
                      label="Graph Topology"
                      value={
                        graph
                          ? `${graph.nodes.length} nodes · ${graph.edges.length} edges`
                          : "0 nodes"
                      }
                    />
                    <DebugItem
                      label="Navigation Status"
                      value={
                        isNavigating
                          ? navProgress?.isOffWalkway
                            ? "OFF WALKWAY (Rerouting)"
                            : "ACTIVE: Live Tracking"
                          : routeResult
                            ? "READY"
                            : `FAILED: ${routeError || "No path"}`
                      }
                      isError={!routeResult || (isNavigating && navProgress?.isOffWalkway)}
                    />
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Turn-by-Turn Directions Panel */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <NavIcon className="h-4 w-4 text-primary" /> Live Directions
            </h3>
            <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {routeResult?.steps.length || 0} Steps
            </span>
          </div>

          {routeError && (
            <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/15 p-3 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Route Error</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{routeError}</div>
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {routeResult?.steps && routeResult.steps.length > 0 ? (
              routeResult.steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-3.5 border-b border-border/20 pb-3 last:border-0"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary font-bold text-xs">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold leading-snug">{s.text}</div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {s.distance}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Select a destination or start navigation to view live walkway directions.
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
}

function LocationSearch({
  label,
  value,
  onSelect,
}: {
  label: string;
  value: string;
  onSelect: (loc: { name: string; lat: number; lng: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const items = VERIFIED_CAMPUS_LOCATIONS.filter((loc) =>
    `${loc.name} ${loc.type}`.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="relative">
      <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left rounded-xl border border-border/50 bg-background/50 px-3.5 py-2.5 text-xs font-semibold text-foreground flex items-center justify-between hover:bg-background/80 transition"
      >
        <span className="truncate">{value}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground ml-1" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border/60 bg-background/95 p-1 shadow-xl backdrop-blur">
          <input
            type="text"
            placeholder="Search campus locations..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-lg bg-background/80 border border-border/60 px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary mb-1"
            autoFocus
          />
          {items.map((loc) => (
            <button
              type="button"
              key={loc.id}
              onClick={() => {
                onSelect({ name: loc.name, lat: loc.lat, lng: loc.lng });
                setOpen(false);
              }}
              className="block w-full rounded-lg px-2.5 py-2 text-left text-xs hover:bg-primary/15 transition"
            >
              <div className="font-semibold text-foreground">{loc.name}</div>
              <div className="text-[10px] text-muted-foreground capitalize">{loc.type}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
        {k}
      </div>
      <div className="text-sm font-bold text-primary mt-0.5 truncate">{v}</div>
    </div>
  );
}

function DebugItem({ label, value, isError }: { label: string; value: string; isError?: boolean }) {
  return (
    <div className="rounded-lg border border-border/30 bg-background/30 p-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`text-[11px] font-semibold mt-0.5 truncate ${isError ? "text-amber-400" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}
