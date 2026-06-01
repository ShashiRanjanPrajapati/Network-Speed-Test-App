import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Read and discard all incoming bytes; respond with size received
  const reader = req.body?.getReader();
  let totalBytes = 0;

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) totalBytes += value.byteLength;
    }
  }

  return new Response(JSON.stringify({ received: totalBytes, ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
