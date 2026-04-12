import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Dynamic PNG icon generator for the PWA manifest.
 * Usage: /api/icon?size=192  or  /api/icon?size=512
 */
export async function GET(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get("size") || "512");
  const px = Math.min(Math.max(raw, 16), 1024);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FF6B35",
          borderRadius: px * 0.22,
        }}
      >
        <span
          style={{
            fontSize: px * 0.65,
            fontWeight: 800,
            color: "#FFFFFF",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          F
        </span>
      </div>
    ),
    { width: px, height: px },
  );
}
