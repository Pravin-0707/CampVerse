import { Campus3DViewer } from "./map/Campus3DViewer";

export function ViewerPlaceholder({
  height = "h-[520px]",
  label = "Campus Leaflet Map",
}: {
  height?: string;
  label?: string;
}) {
  return <Campus3DViewer height={height} label={label} />;
}
