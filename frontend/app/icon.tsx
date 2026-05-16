import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 30% 30%, #1d4ed8 0%, #050505 65%)",
          color: "#ffffff",
          fontSize: 180,
          fontWeight: 800,
          letterSpacing: -8,
          borderRadius: 96,
          border: "12px solid rgba(255,255,255,0.15)",
        }}
      >
        CS
      </div>
    ),
    {
      ...size,
    }
  );
}
