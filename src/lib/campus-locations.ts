export interface VerifiedCampusLocation {
  id: string;
  name: string;
  type: "facility" | "building" | "gate";
  lat: number;
  lng: number;
}

/**
 * Verified campus locations for Sri Krishna College of Engineering (SKCET), Coimbatore.
 * Coordinates provided directly from campus GeoJSON Point features and verified field data.
 * All coordinates are in [lat, lng] for Leaflet / [lng, lat] for GeoJSON.
 */
export const VERIFIED_CAMPUS_LOCATIONS: VerifiedCampusLocation[] = [
  // --- Upper campus (northern) ---
  {
    id: "library",
    name: "Library / Vankatram Learning Centre",
    type: "facility",
    lat: 10.938559,
    lng: 76.956052,
  },
  { id: "food-court", name: "Food Court", type: "facility", lat: 10.938755, lng: 76.956653 },
  {
    id: "convention-center",
    name: "Convention Center",
    type: "facility",
    lat: 10.938241,
    lng: 76.956599,
  },
  { id: "admin", name: "Admin Block", type: "building", lat: 10.937722, lng: 76.956301 },
  // --- Mid campus ---
  { id: "mba", name: "MBA Block", type: "building", lat: 10.937504, lng: 76.955711 },
  { id: "mca-a", name: "MCA Block", type: "building", lat: 10.937186, lng: 76.955895 },
  { id: "mca-b", name: "MCA Block (Wing B)", type: "building", lat: 10.937193, lng: 76.955696 },
  { id: "c1", name: "C1 Block", type: "building", lat: 10.937196, lng: 76.956258 },
  { id: "c2", name: "C2 Block", type: "building", lat: 10.937208, lng: 76.956645 },
  // --- Lower-mid campus ---
  { id: "c3", name: "C3 Block", type: "building", lat: 10.936701, lng: 76.955847 },
  { id: "eee", name: "EEE Block", type: "building", lat: 10.936673, lng: 76.956219 },
  { id: "cse-it", name: "CSE / IT Block", type: "building", lat: 10.936688, lng: 76.956629 },
  { id: "bike-parking", name: "Bike Parking", type: "facility", lat: 10.936986, lng: 76.954976 },
  // --- Lower campus (southern) ---
  { id: "ece", name: "ECE Block", type: "building", lat: 10.936326, lng: 76.956346 },
  {
    id: "mechatronic",
    name: "Mechatronics Block",
    type: "building",
    lat: 10.936342,
    lng: 76.956646,
  },
  { id: "civil", name: "Civil Block", type: "building", lat: 10.936304, lng: 76.955839 },
  { id: "mechanical", name: "Mechanical Block", type: "building", lat: 10.935967, lng: 76.956414 },
];

export const CAMPUS_BOUNDS = {
  // GeoJSON walkway network bounds with margin
  minLat: 10.933,
  maxLat: 10.942,
  minLng: 76.95,
  maxLng: 76.962,
};

export function isWithinCampusBounds(lat: number, lng: number): boolean {
  return (
    lat >= CAMPUS_BOUNDS.minLat &&
    lat <= CAMPUS_BOUNDS.maxLat &&
    lng >= CAMPUS_BOUNDS.minLng &&
    lng <= CAMPUS_BOUNDS.maxLng
  );
}

/**
 * Returns the nearest verified campus location within thresholdMeters, or null.
 * Uses flat-earth approximation (accurate enough within campus scale).
 */
export function findNearbyVerifiedLocation(
  lat: number,
  lng: number,
  thresholdMeters = 25,
): VerifiedCampusLocation | null {
  let closest: VerifiedCampusLocation | null = null;
  let closestDist = Infinity;

  for (const loc of VERIFIED_CAMPUS_LOCATIONS) {
    const dLat = (lat - loc.lat) * 111319.5;
    const dLng = (lng - loc.lng) * 111319.5 * Math.cos((lat * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist <= thresholdMeters && dist < closestDist) {
      closestDist = dist;
      closest = loc;
    }
  }
  return closest;
}
