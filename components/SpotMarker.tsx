import L from "leaflet";
import type { SpotStatus } from "@/lib/types";

const statusColor: Record<SpotStatus, string> = {
  new: "#dc2626", // красный — ещё не взято в работу
  in_progress: "#d97706", // жёлтый/оранжевый — в работе
  done: "#3c9646", // зелёный — закрыто
};

/** Цветная точка-маркер Leaflet, цвет зависит от статуса метки. */
export function spotIcon(status: SpotStatus) {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;
      width:18px;height:18px;
      border-radius:9999px;
      background:${statusColor[status]};
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,.4);
    "></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export function pendingSpotIcon() {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;
      width:20px;height:20px;
      border-radius:9999px;
      background:#2c7936;
      opacity:.85;
      border:2px dashed white;
    "></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}
