import { ImageResponse } from "next/og"

// Route segment config
export const runtime = "edge"

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = "image/png"

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // Emerald rounded-square with forward-motion chevron icon
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: "#10b981",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Speed line top */}
        <div
          style={{
            position: "absolute",
            left: 5,
            top: 11,
            width: 11,
            height: 3,
            borderRadius: 2,
            background: "rgba(255,255,255,0.7)",
          }}
        />
        {/* Speed line bottom */}
        <div
          style={{
            position: "absolute",
            left: 5,
            top: 18,
            width: 8,
            height: 3,
            borderRadius: 2,
            background: "rgba(255,255,255,0.55)",
          }}
        />
        {/* Chevron arrow — simulated with rotated divs */}
        <div
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            marginTop: -9,
            width: 0,
            height: 0,
            borderTop: "9px solid transparent",
            borderBottom: "9px solid transparent",
            borderLeft: "11px solid white",
          }}
        />
      </div>
    ),
    { ...size }
  )
}
