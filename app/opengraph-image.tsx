import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#1c3f22",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#2c7936",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            🌿
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, color: "#f0f9f0" }}>EcoTown</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 52, fontWeight: 700, color: "#ffffff", maxWidth: 900 }}>
          Карта волонтёров Орала
        </div>
        <div style={{ marginTop: 24, fontSize: 28, color: "#b8e0bb", maxWidth: 800 }}>
          Отмечай загрязнённые места города и бери их в работу вместе с волонтёрами
        </div>
      </div>
    ),
    { ...size }
  );
}
