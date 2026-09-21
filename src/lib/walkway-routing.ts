export type GeoPoint = { lat: number; lng: number };

export interface GeoJSONFeature {
  type?: string;
  properties?: Record<string, unknown>;
  geometry?: {
    type?: string;
    coordinates?: any;
  };
}

export interface GeoJSONFeatureCollection {
  type?: string;
  features: GeoJSONFeature[];
}

export interface GraphNode extends GeoPoint {
  id: number;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: number;
  u: number;
  v: number;
  distance: number;
}

export interface GraphSegment {
  edgeId: number;
  u: number;
  v: number;
  p1: GraphNode;
  p2: GraphNode;
  xy1: { x: number; y: number };
  xy2: { x: number; y: number };
  distance: number;
}

export interface WalkwayGraph {
  nodes: GraphNode[];
  adj: Array<Array<{ to: number; distance: number }>>;
  edges: GraphEdge[];
  graphSegments: GraphSegment[];
  toleranceMeters: number;
}

export interface SnappedPoint {
  segment: GraphSegment;
  t: number;
  projXY: { x: number; y: number };
  projLatLng: GeoPoint;
  distanceToSegment: number;
}

export interface NavigationStep {
  text: string;
  distance: string;
  distanceMeters: number;
  lat: number;
  lng: number;
}

export interface RouteDebugInfo {
  start: GeoPoint;
  target: GeoPoint;
  snapStart: GeoPoint | null;
  snapTarget: GeoPoint | null;
  startDistToWalkway: number | null;
  targetDistToWalkway: number | null;
  nearestStartSegment: GraphSegment | null;
  nearestTargetSegment: GraphSegment | null;
  nodeCount: number;
  edgeCount: number;
  routeDistanceMeters: number | null;
  estimatedMinutes: number | null;
  walkingSpeedMpm: number;
  connectionToleranceMeters: number;
  status: "success" | "failed";
  failureReason: string | null;
}

export interface WalkwayRouteResult {
  coordinates: GeoPoint[];
  distance: number; // in meters
  minutes: number; // estimated walking time in minutes
  steps: NavigationStep[];
  debug: RouteDebugInfo;
}

const EARTH_RADIUS = 6371000; // Earth's mean radius in meters
const REF_LAT = 10.9358;
const REF_LNG = 76.9552;
const DEG_TO_RAD = Math.PI / 180;
const METERS_PER_DEG_LAT = 111319.5;
const METERS_PER_DEG_LNG = 111319.5 * Math.cos(REF_LAT * DEG_TO_RAD);

export function haversine(p1: GeoPoint, p2: GeoPoint): number {
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function toLocalXY(p: GeoPoint): { x: number; y: number } {
  return {
    x: (p.lng - REF_LNG) * METERS_PER_DEG_LNG,
    y: (p.lat - REF_LAT) * METERS_PER_DEG_LAT,
  };
}

export function toLatLngFromXY(xy: { x: number; y: number }): GeoPoint {
  return {
    lat: REF_LAT + xy.y / METERS_PER_DEG_LAT,
    lng: REF_LNG + xy.x / METERS_PER_DEG_LNG,
  };
}

/**
 * Builds a topological graph from GeoJSON LineString features.
 * - Extracts ONLY LineString features (ignores Point features for routing).
 * - Finds LineString-LineString intersections and T-junctions.
 * - Subdivides segments at intersection points.
 * - Connects nearby walkway nodes within connection tolerance (3-8m, default 5m).
 */
export function buildWalkwayGraph(
  data: GeoJSONFeatureCollection | null,
  toleranceMeters: number = 5,
): WalkwayGraph {
  const emptyGraph: WalkwayGraph = {
    nodes: [],
    adj: [],
    edges: [],
    graphSegments: [],
    toleranceMeters,
  };

  if (!data?.features?.length) return emptyGraph;

  // Filter ONLY LineString features
  const lineStrings: GeoPoint[][] = [];
  for (const feature of data.features) {
    if (
      feature.geometry?.type === "LineString" &&
      Array.isArray(feature.geometry.coordinates) &&
      feature.geometry.coordinates.length >= 2
    ) {
      const coords: GeoPoint[] = feature.geometry.coordinates
        .map(([lng, lat]: [number, number]) => ({ lat, lng }))
        .filter((pt: GeoPoint) => Number.isFinite(pt.lat) && Number.isFinite(pt.lng));
      if (coords.length >= 2) {
        lineStrings.push(coords);
      }
    }
  }

  if (!lineStrings.length) return emptyGraph;

  // 1. Collect raw segments
  interface RawSegment {
    id: number;
    lsIdx: number;
    segIdx: number;
    p1: GeoPoint;
    p2: GeoPoint;
    xy1: { x: number; y: number };
    xy2: { x: number; y: number };
    len: number;
    splitT: number[];
  }

  const rawSegments: RawSegment[] = [];
  lineStrings.forEach((ls, lsIdx) => {
    for (let i = 0; i < ls.length - 1; i++) {
      const p1 = ls[i];
      const p2 = ls[i + 1];
      const xy1 = toLocalXY(p1);
      const xy2 = toLocalXY(p2);
      const len = Math.hypot(xy2.x - xy1.x, xy2.y - xy1.y);
      if (len > 0.001) {
        rawSegments.push({
          id: rawSegments.length,
          lsIdx,
          segIdx: i,
          p1,
          p2,
          xy1,
          xy2,
          len,
          splitT: [0, 1],
        });
      }
    }
  });

  // 2. Find geometric LineString segment intersections
  for (let i = 0; i < rawSegments.length; i++) {
    const s1 = rawSegments[i];
    for (let j = i + 1; j < rawSegments.length; j++) {
      const s2 = rawSegments[j];
      const { x: x1, y: y1 } = s1.xy1;
      const { x: x2, y: y2 } = s1.xy2;
      const { x: x3, y: y3 } = s2.xy1;
      const { x: x4, y: y4 } = s2.xy2;

      const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
      if (Math.abs(denom) > 1e-10) {
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

        if (ua >= -1e-4 && ua <= 1 + 1e-4 && ub >= -1e-4 && ub <= 1 + 1e-4) {
          const tA = Math.max(0, Math.min(1, ua));
          const tB = Math.max(0, Math.min(1, ub));
          s1.splitT.push(tA);
          s2.splitT.push(tB);
        }
      }
    }
  }

  // 3. Detect T-junctions or near-touches within connection tolerance
  for (let i = 0; i < rawSegments.length; i++) {
    const seg = rawSegments[i];
    const dx = seg.xy2.x - seg.xy1.x;
    const dy = seg.xy2.y - seg.xy1.y;
    const segLenSq = dx * dx + dy * dy;

    if (segLenSq > 1e-10) {
      for (let j = 0; j < rawSegments.length; j++) {
        if (i === j) continue;
        const other = rawSegments[j];
        const checkPoints = [other.xy1, other.xy2];
        for (const pt of checkPoints) {
          const t = ((pt.x - seg.xy1.x) * dx + (pt.y - seg.xy1.y) * dy) / segLenSq;
          if (t >= 0 && t <= 1) {
            const projX = seg.xy1.x + t * dx;
            const projY = seg.xy1.y + t * dy;
            const dist = Math.hypot(pt.x - projX, pt.y - projY);
            if (dist <= toleranceMeters) {
              seg.splitT.push(t);
            }
          }
        }
      }
    }
  }

  // 4. Subdivide segments at sorted splitT points
  interface SubSegment {
    pt1: { x: number; y: number };
    pt2: { x: number; y: number };
    p1: GeoPoint;
    p2: GeoPoint;
    length: number;
  }

  const subSegments: SubSegment[] = [];
  rawSegments.forEach((seg) => {
    const tList = Array.from(new Set(seg.splitT.map((t) => Math.round(t * 1e6) / 1e6)))
      .filter((t) => t >= 0 && t <= 1)
      .sort((a, b) => a - b);

    for (let i = 0; i < tList.length - 1; i++) {
      const t1 = tList[i];
      const t2 = tList[i + 1];
      if (t2 - t1 > 1e-5) {
        const pt1 = {
          x: seg.xy1.x + t1 * (seg.xy2.x - seg.xy1.x),
          y: seg.xy1.y + t1 * (seg.xy2.y - seg.xy1.y),
        };
        const pt2 = {
          x: seg.xy1.x + t2 * (seg.xy2.x - seg.xy1.x),
          y: seg.xy1.y + t2 * (seg.xy2.y - seg.xy1.y),
        };
        subSegments.push({
          pt1,
          pt2,
          p1: toLatLngFromXY(pt1),
          p2: toLatLngFromXY(pt2),
          length: Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y),
        });
      }
    }
  });

  // 5. Build nodes with spatial clustering using tolerance
  const nodes: GraphNode[] = [];
  function getOrCreateNode(pt: { x: number; y: number }): number {
    for (let i = 0; i < nodes.length; i++) {
      const d = Math.hypot(nodes[i].x - pt.x, nodes[i].y - pt.y);
      if (d <= toleranceMeters) {
        return i;
      }
    }
    const id = nodes.length;
    const latLng = toLatLngFromXY(pt);
    nodes.push({ id, x: pt.x, y: pt.y, lat: latLng.lat, lng: latLng.lng });
    return id;
  }

  const adj: Array<Array<{ to: number; distance: number }>> = [];
  const edges: GraphEdge[] = [];

  subSegments.forEach((sub) => {
    const u = getOrCreateNode(sub.pt1);
    const v = getOrCreateNode(sub.pt2);
    if (u !== v) {
      while (adj.length <= Math.max(u, v)) adj.push([]);
      const dist = haversine(nodes[u], nodes[v]);
      if (!adj[u].some((e) => e.to === v)) {
        adj[u].push({ to: v, distance: dist });
        adj[v].push({ to: u, distance: dist });
        edges.push({ id: edges.length, u, v, distance: dist });
      }
    }
  });

  while (adj.length < nodes.length) adj.push([]);

  const graphSegments: GraphSegment[] = edges.map((e) => ({
    edgeId: e.id,
    u: e.u,
    v: e.v,
    p1: nodes[e.u],
    p2: nodes[e.v],
    xy1: { x: nodes[e.u].x, y: nodes[e.u].y },
    xy2: { x: nodes[e.v].x, y: nodes[e.v].y },
    distance: e.distance,
  }));

  return { nodes, adj, edges, graphSegments, toleranceMeters };
}

/**
 * Snaps any coordinate to the nearest walkway segment in the graph.
 */
export function snapToWalkway(graph: WalkwayGraph, queryPoint: GeoPoint): SnappedPoint | null {
  if (!graph?.graphSegments?.length) return null;

  const qXY = toLocalXY(queryPoint);
  let best: SnappedPoint | null = null;
  let minDistance = Infinity;

  for (const seg of graph.graphSegments) {
    const dx = seg.xy2.x - seg.xy1.x;
    const dy = seg.xy2.y - seg.xy1.y;
    const segLenSq = dx * dx + dy * dy;
    let t = 0;
    if (segLenSq > 1e-10) {
      t = ((qXY.x - seg.xy1.x) * dx + (qXY.y - seg.xy1.y) * dy) / segLenSq;
      t = Math.max(0, Math.min(1, t));
    }
    const projXY = {
      x: seg.xy1.x + t * dx,
      y: seg.xy1.y + t * dy,
    };
    const projLatLng = toLatLngFromXY(projXY);
    const dist = haversine(queryPoint, projLatLng);

    if (dist < minDistance) {
      minDistance = dist;
      best = {
        segment: seg,
        t,
        projXY,
        projLatLng,
        distanceToSegment: dist,
      };
    }
  }

  return best;
}

function computeBearing(from: GeoPoint, to: GeoPoint): string {
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;

  const directions = [
    "North",
    "Northeast",
    "East",
    "Southeast",
    "South",
    "Southwest",
    "West",
    "Northwest",
  ];
  const index = Math.round(brng / 45) % 8;
  return directions[index];
}

function buildTurnByTurnSteps(coords: GeoPoint[]): NavigationStep[] {
  if (coords.length < 2) return [];

  const steps: NavigationStep[] = [];
  steps.push({
    text: "Start at selected location",
    distance: "0 m",
    distanceMeters: 0,
    lat: coords[0].lat,
    lng: coords[0].lng,
  });

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const segDist = Math.round(haversine(p1, p2));
    if (segDist < 1 && i < coords.length - 2) continue;

    const dir = computeBearing(p1, p2);
    let instruction: string;
    if (i === 0) {
      instruction = `Walk ${segDist} m to join campus walkway (${dir})`;
    } else if (i === coords.length - 2) {
      instruction = `Follow path ${segDist} m towards destination`;
    } else {
      instruction = `Continue ${dir} along walkway for ${segDist} m`;
    }

    steps.push({
      text: instruction,
      distance: `${segDist} m`,
      distanceMeters: segDist,
      lat: p2.lat,
      lng: p2.lng,
    });
  }

  steps.push({
    text: "Arrived at destination",
    distance: "Destination",
    distanceMeters: 0,
    lat: coords[coords.length - 1].lat,
    lng: coords[coords.length - 1].lng,
  });

  return steps;
}

/**
 * A* route calculation across the GeoJSON walkway network.
 * - Start and destination coordinates snap to nearest walkway segments.
 * - Connectors are added from selected points to nearest walkway segments.
 * - Uses A* algorithm with Haversine distance heuristic.
 * - Calculates distance from actual route coordinates.
 * - Estimates walking time at 70 meters per minute (configurable).
 */
export function findWalkwayRoute(
  graphOrData: WalkwayGraph | GeoJSONFeatureCollection | null,
  start: GeoPoint,
  target: GeoPoint,
  options?: {
    walkingSpeedMpm?: number;
    toleranceMeters?: number;
  },
): WalkwayRouteResult | null {
  const speed = options?.walkingSpeedMpm ?? 70;
  const tolerance = options?.toleranceMeters ?? 5;

  let graph: WalkwayGraph;
  if (!graphOrData) {
    return null;
  } else if ("nodes" in graphOrData && Array.isArray((graphOrData as WalkwayGraph).nodes)) {
    graph = graphOrData as WalkwayGraph;
  } else {
    graph = buildWalkwayGraph(graphOrData as GeoJSONFeatureCollection, tolerance);
  }

  if (!graph.nodes.length) {
    return null;
  }

  const snapStart = snapToWalkway(graph, start);
  const snapTarget = snapToWalkway(graph, target);

  const baseDebug: RouteDebugInfo = {
    start,
    target,
    snapStart: snapStart?.projLatLng ?? null,
    snapTarget: snapTarget?.projLatLng ?? null,
    startDistToWalkway: snapStart ? Math.round(snapStart.distanceToSegment) : null,
    targetDistToWalkway: snapTarget ? Math.round(snapTarget.distanceToSegment) : null,
    nearestStartSegment: snapStart?.segment ?? null,
    nearestTargetSegment: snapTarget?.segment ?? null,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    routeDistanceMeters: null,
    estimatedMinutes: null,
    walkingSpeedMpm: speed,
    connectionToleranceMeters: graph.toleranceMeters,
    status: "failed",
    failureReason: null,
  };

  if (!snapStart || !snapTarget) {
    baseDebug.failureReason = "Could not snap start or destination coordinates to walkway network";
    return null;
  }

  // Handle case where start and destination snap to the exact same segment
  if (snapStart.segment.edgeId === snapTarget.segment.edgeId) {
    const rawCoords = [start, snapStart.projLatLng, snapTarget.projLatLng, target];
    const cleanCoords: GeoPoint[] = [];
    for (let i = 0; i < rawCoords.length; i++) {
      if (i === 0 || haversine(rawCoords[i], rawCoords[i - 1]) > 0.1) {
        cleanCoords.push(rawCoords[i]);
      }
    }

    let totalDist = 0;
    for (let i = 0; i < cleanCoords.length - 1; i++) {
      totalDist += haversine(cleanCoords[i], cleanCoords[i + 1]);
    }

    const roundedDist = Math.round(totalDist);
    const estMinutes = Math.max(1, Math.round(roundedDist / speed));

    baseDebug.status = "success";
    baseDebug.routeDistanceMeters = roundedDist;
    baseDebug.estimatedMinutes = estMinutes;

    return {
      coordinates: cleanCoords,
      distance: roundedDist,
      minutes: estMinutes,
      steps: buildTurnByTurnSteps(cleanCoords),
      debug: baseDebug,
    };
  }

  // Build virtual graph with start and target snapped points
  const startNodeId = graph.nodes.length;
  const targetNodeId = graph.nodes.length + 1;

  const tempNodes: GraphNode[] = [
    ...graph.nodes,
    { id: startNodeId, ...snapStart.projLatLng, x: snapStart.projXY.x, y: snapStart.projXY.y },
    { id: targetNodeId, ...snapTarget.projLatLng, x: snapTarget.projXY.x, y: snapTarget.projXY.y },
  ];

  const tempAdj: Array<Array<{ to: number; distance: number }>> = graph.adj.map((list) => [
    ...list,
  ]);
  tempAdj.push([]); // startNodeId
  tempAdj.push([]); // targetNodeId

  // Connect startNodeId to its segment endpoints
  const sU = snapStart.segment.u;
  const sV = snapStart.segment.v;
  const dStartU = haversine(snapStart.projLatLng, graph.nodes[sU]);
  const dStartV = haversine(snapStart.projLatLng, graph.nodes[sV]);
  tempAdj[startNodeId].push({ to: sU, distance: dStartU });
  tempAdj[sU].push({ to: startNodeId, distance: dStartU });
  tempAdj[startNodeId].push({ to: sV, distance: dStartV });
  tempAdj[sV].push({ to: startNodeId, distance: dStartV });

  // Connect targetNodeId to its segment endpoints
  const tU = snapTarget.segment.u;
  const tV = snapTarget.segment.v;
  const dTargetU = haversine(snapTarget.projLatLng, graph.nodes[tU]);
  const dTargetV = haversine(snapTarget.projLatLng, graph.nodes[tV]);
  tempAdj[targetNodeId].push({ to: tU, distance: dTargetU });
  tempAdj[tU].push({ to: targetNodeId, distance: dTargetU });
  tempAdj[targetNodeId].push({ to: tV, distance: dTargetV });
  tempAdj[tV].push({ to: targetNodeId, distance: dTargetV });

  // A* search
  const distances = new Array(tempNodes.length).fill(Infinity);
  const scores = new Array(tempNodes.length).fill(Infinity);
  const previous = new Array(tempNodes.length).fill(-1);
  const open = new Set<number>([startNodeId]);

  distances[startNodeId] = 0;
  scores[startNodeId] = haversine(tempNodes[startNodeId], tempNodes[targetNodeId]);

  while (open.size > 0) {
    let current = -1;
    let bestScore = Infinity;
    for (const id of open) {
      if (scores[id] < bestScore) {
        bestScore = scores[id];
        current = id;
      }
    }

    if (current === -1 || current === targetNodeId) break;
    open.delete(current);

    for (const edge of tempAdj[current]) {
      const candidate = distances[current] + edge.distance;
      if (candidate < distances[edge.to]) {
        distances[edge.to] = candidate;
        previous[edge.to] = current;
        scores[edge.to] = candidate + haversine(tempNodes[edge.to], tempNodes[targetNodeId]);
        open.add(edge.to);
      }
    }
  }

  if (!Number.isFinite(distances[targetNodeId])) {
    baseDebug.failureReason = "No connected walkway path exists between start and destination";
    return null;
  }

  // Reconstruct path
  const pathNodes: number[] = [];
  for (let curr = targetNodeId; curr >= 0; curr = previous[curr]) {
    pathNodes.unshift(curr);
  }

  const walkwayCoords: GeoPoint[] = pathNodes.map((id) => ({
    lat: tempNodes[id].lat,
    lng: tempNodes[id].lng,
  }));

  const fullCoords = [start, ...walkwayCoords, target];

  // Filter consecutive duplicate coordinates
  const cleanCoords: GeoPoint[] = [];
  for (let i = 0; i < fullCoords.length; i++) {
    if (i === 0 || haversine(fullCoords[i], fullCoords[i - 1]) > 0.1) {
      cleanCoords.push(fullCoords[i]);
    }
  }

  let totalDist = 0;
  for (let i = 0; i < cleanCoords.length - 1; i++) {
    totalDist += haversine(cleanCoords[i], cleanCoords[i + 1]);
  }

  const roundedDist = Math.round(totalDist);
  const estMinutes = Math.max(1, Math.round(roundedDist / speed));

  baseDebug.status = "success";
  baseDebug.routeDistanceMeters = roundedDist;
  baseDebug.estimatedMinutes = estMinutes;

  return {
    coordinates: cleanCoords,
    distance: roundedDist,
    minutes: estMinutes,
    steps: buildTurnByTurnSteps(cleanCoords),
    debug: baseDebug,
  };
}

export interface NavigationProgressInfo {
  isOffWalkway: boolean;
  isOffRoute: boolean;
  distToWalkway: number; // in meters
  distToRoute: number; // in meters
  progressPercent: number; // 0 to 100
  remainingDistanceMeters: number;
  remainingMinutes: number;
  closestRoutePoint: GeoPoint | null;
  snappedWalkwayPoint: GeoPoint | null;
  nearestSegment: GraphSegment | null;
}

/**
 * Calculates live user progress along an active route and detects if user is off-walkway or off-route.
 */
export function calculateNavigationProgress(
  graph: WalkwayGraph | null,
  userLocation: GeoPoint,
  route: WalkwayRouteResult | null,
  walkingSpeedMpm: number = 70,
): NavigationProgressInfo {
  const result: NavigationProgressInfo = {
    isOffWalkway: false,
    isOffRoute: false,
    distToWalkway: 0,
    distToRoute: 0,
    progressPercent: 0,
    remainingDistanceMeters: route ? route.distance : 0,
    remainingMinutes: route ? route.minutes : 0,
    closestRoutePoint: null,
    snappedWalkwayPoint: null,
    nearestSegment: null,
  };

  if (!graph || !graph.graphSegments.length) return result;

  // 1. Distance to nearest walkway segment
  const snap = snapToWalkway(graph, userLocation);
  if (snap) {
    result.distToWalkway = Math.round(snap.distanceToSegment);
    result.snappedWalkwayPoint = snap.projLatLng;
    result.nearestSegment = snap.segment;
    // Off walkway if > 15m away from any registered walkway
    if (result.distToWalkway > 15) {
      result.isOffWalkway = true;
    }
  }

  // 2. Distance to active route polyline
  if (route && route.coordinates.length >= 2) {
    let minDistToRoute = Infinity;
    let closestPt: GeoPoint | null = null;
    let closestSegIndex = 0;

    const uXY = toLocalXY(userLocation);

    for (let i = 0; i < route.coordinates.length - 1; i++) {
      const p1 = route.coordinates[i];
      const p2 = route.coordinates[i + 1];
      const xy1 = toLocalXY(p1);
      const xy2 = toLocalXY(p2);

      const dx = xy2.x - xy1.x;
      const dy = xy2.y - xy1.y;
      const lenSq = dx * dx + dy * dy;
      let t = 0;
      if (lenSq > 1e-10) {
        t = ((uXY.x - xy1.x) * dx + (uXY.y - xy1.y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
      }

      const projXY = { x: xy1.x + t * dx, y: xy1.y + t * dy };
      const projLatLng = toLatLngFromXY(projXY);
      const dist = haversine(userLocation, projLatLng);

      if (dist < minDistToRoute) {
        minDistToRoute = dist;
        closestPt = projLatLng;
        closestSegIndex = i;
      }
    }

    result.distToRoute = Math.round(minDistToRoute);
    result.closestRoutePoint = closestPt;

    // Off route if > 18m away from the planned route line
    if (result.distToRoute > 18) {
      result.isOffRoute = true;
    }

    // 3. Compute remaining distance from closest point along route to destination
    if (closestPt) {
      let remDist = haversine(userLocation, closestPt);
      for (let i = closestSegIndex; i < route.coordinates.length - 1; i++) {
        if (i === closestSegIndex) {
          remDist += haversine(closestPt, route.coordinates[i + 1]);
        } else {
          remDist += haversine(route.coordinates[i], route.coordinates[i + 1]);
        }
      }

      result.remainingDistanceMeters = Math.max(0, Math.round(remDist));
      result.remainingMinutes = Math.max(
        1,
        Math.round(result.remainingDistanceMeters / walkingSpeedMpm),
      );

      const totalDist = route.distance > 0 ? route.distance : 1;
      const traversed = Math.max(0, totalDist - result.remainingDistanceMeters);
      result.progressPercent = Math.min(
        100,
        Math.max(0, Math.round((traversed / totalDist) * 100)),
      );
    }
  }

  return result;
}
