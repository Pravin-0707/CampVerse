import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Layers, ZoomIn, ZoomOut, RotateCcw, MapPin, Loader2 } from "lucide-react";

interface Point2D {
  x: number;
  y: number;
}

interface PolylineData {
  layer: string;
  color?: number;
  closed?: boolean;
  points: Point2D[];
}

interface HatchData {
  layer: string;
  paths: Point2D[][];
}

interface TextData {
  text: string;
  layer: string;
  x: number;
  y: number;
  height?: number;
}

interface Map2DData {
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  polylines: PolylineData[];
  hatches: HatchData[];
  texts: TextData[];
}

const LAYER_COLORS: Record<string, string> = {
  "0": "rgba(255, 255, 255, 0.4)",
  TPX_FRAME_PROJECT: "rgba(0, 240, 255, 0.8)",
  BUILDINGS: "rgba(139, 92, 246, 0.9)",
  ROADS: "rgba(245, 158, 11, 0.7)",
  GREENERY: "rgba(34, 197, 94, 0.7)",
  TEXT: "rgba(255, 255, 255, 0.9)",
};

export function Campus2DViewer({ height = "h-[600px]" }: { height?: string }) {
  const [dataset, setDataset] = useState<"main" | "extended">("main");
  const [mapData, setMapData] = useState<Map2DData | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({});
  const [hoveredText, setHoveredText] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const file = dataset === "main" ? "/maps/campus_2d_main.json" : "/maps/campus_2d_extended.json";
    fetch(file)
      .then((res) => res.json())
      .then((data: Map2DData) => {
        setMapData(data);
        const layers: Record<string, boolean> = {};
        data.polylines.forEach((p) => (layers[p.layer] = true));
        data.hatches.forEach((h) => (layers[h.layer] = true));
        data.texts.forEach((t) => (layers[t.layer] = true));
        setActiveLayers(layers);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed loading 2D map JSON", err);
        setLoading(false);
      });
  }, [dataset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const toggleLayer = (layer: string) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (loading || !mapData) {
    return (
      <div
        className={`relative ${height} w-full rounded-2xl glass-strong flex items-center justify-center`}
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Parsing CAD Vector Map…</span>
        </div>
      </div>
    );
  }

  const { bounds, polylines, hatches, texts } = mapData;
  const padding = 20;
  const viewBoxWidth = bounds.width + padding * 2;
  const viewBoxHeight = bounds.height + padding * 2;
  const minX = bounds.minX - padding;
  const minY = bounds.minY - padding;

  return (
    <div
      ref={containerRef}
      className={`relative ${height} w-full rounded-2xl overflow-hidden glass-strong border border-border/40 select-none cursor-grab active:cursor-grabbing`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Toolbar */}
      <div
        className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center rounded-xl bg-background/80 p-1 border border-border/50 backdrop-blur">
          <button
            onClick={() => setDataset("main")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${dataset === "main" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            Main Campus DXF
          </button>
          <button
            onClick={() => setDataset("extended")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${dataset === "extended" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            Extended Campus DXF
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-background/80 p-1 border border-border/50 backdrop-blur">
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.2, 5))}
            className="p-1.5 rounded-lg hover:bg-accent/40 text-foreground transition"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z / 1.2, 0.5))}
            className="p-1.5 rounded-lg hover:bg-accent/40 text-foreground transition"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg hover:bg-accent/40 text-foreground transition"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Layer selector */}
      <div
        className="absolute top-4 right-4 z-20 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-xl bg-background/80 p-2 border border-border/50 backdrop-blur max-w-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            <Layers className="h-3.5 w-3.5 text-primary" /> DXF Layers
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.keys(activeLayers).map((layer) => (
              <button
                key={layer}
                onClick={() => toggleLayer(layer)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition border ${activeLayers[layer] ? "bg-primary/20 border-primary text-primary" : "bg-muted/30 border-transparent text-muted-foreground"}`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
        }}
      >
        <svg
          viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-full max-h-full max-w-full"
          style={{ transform: "scaleY(-1)" }} // Flip CAD Y coords to standard SVG direction
        >
          {/* Grid Background lines */}
          <defs>
            <pattern id="cadGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect
            x={minX}
            y={minY}
            width={viewBoxWidth}
            height={viewBoxHeight}
            fill="url(#cadGrid)"
          />

          {/* Render Hatches */}
          {hatches.map((h, i) => {
            if (!activeLayers[h.layer]) return null;
            const color = LAYER_COLORS[h.layer] || "rgba(0, 240, 255, 0.15)";
            return h.paths.map((path, j) => {
              if (path.length < 2) return null;
              const pointsStr = path.map((p) => `${p.x},${p.y}`).join(" ");
              return (
                <polygon
                  key={`hatch-${i}-${j}`}
                  points={pointsStr}
                  fill={color}
                  stroke={color}
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              );
            });
          })}

          {/* Render Polylines */}
          {polylines.map((poly, i) => {
            if (!activeLayers[poly.layer]) return null;
            const pointsStr = poly.points.map((p) => `${p.x},${p.y}`).join(" ");
            const strokeColor = LAYER_COLORS[poly.layer] || "rgba(0, 240, 255, 0.75)";
            return (
              <polyline
                key={`poly-${i}`}
                points={pointsStr}
                fill={poly.closed ? strokeColor.replace(/[\d.]+\)$/, "0.15)") : "none"}
                stroke={strokeColor}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Render Text labels */}
          {texts.map((t, i) => {
            if (!activeLayers[t.layer]) return null;
            return (
              <g key={`text-${i}`} transform={`translate(${t.x}, ${t.y}) scale(1, -1)`}>
                <text
                  x="0"
                  y="0"
                  fill="rgba(255, 255, 255, 0.9)"
                  fontSize={t.height ? Math.max(t.height * 2.5, 8) : 10}
                  fontFamily="monospace"
                  fontWeight="600"
                  className="cursor-pointer hover:fill-primary"
                  onMouseEnter={() => setHoveredText(t.text)}
                  onMouseLeave={() => setHoveredText(null)}
                >
                  {t.text}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover Information Banner */}
      {hoveredText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-xl bg-background/90 px-4 py-2 border border-primary/40 backdrop-blur shadow-lg"
        >
          <MapPin className="h-4 w-4 text-primary animate-bounce" />
          <span className="text-xs font-semibold">{hoveredText}</span>
        </motion.div>
      )}
    </div>
  );
}
