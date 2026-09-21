import { VERIFIED_CAMPUS_LOCATIONS, type VerifiedCampusLocation } from "./campus-locations";

export interface WaypointNode {
  id: string;
  name: string;
  category: "Building" | "Classroom" | "Gate" | "Elevator" | "Facility";
  building?: string;
  floor?: number;
  x: number; // Normalized CAD X
  y: number; // Normalized CAD Y
  z?: number; // CAD Z height
  lat?: number;
  lng?: number;
}

export interface NavigationPath {
  totalDistance: number;
  estimatedMinutes: number;
  steps: {
    text: string;
    distance: string;
    nodeId: string;
  }[];
  coordinates: { x: number; y: number; z: number }[];
}

export const WAYPOINTS: Record<string, WaypointNode> = Object.fromEntries(
  VERIFIED_CAMPUS_LOCATIONS.map((loc) => [
    loc.id,
    {
      id: loc.id,
      name: loc.name,
      category: (loc.type === "gate"
        ? "Gate"
        : loc.type === "building"
          ? "Building"
          : "Facility") as WaypointNode["category"],
      building: loc.name,
      x: 0,
      y: 0,
      z: 0,
      lat: loc.lat,
      lng: loc.lng,
    },
  ]),
);
