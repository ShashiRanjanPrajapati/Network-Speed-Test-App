import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Ultra-lightweight health-check endpoint used by useNetworkStatus */
export async function GET(_req: NextRequest) {
  return new Response("ok", {
    status: 200,
    headers: { "Cache-Control": "no-store, no-cache" },
  });
}
