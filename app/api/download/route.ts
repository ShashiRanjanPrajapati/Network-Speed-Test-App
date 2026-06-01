import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Generate a large payload (≈4 MB) for download speed measurement
const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB

function generateRandomBytes(size: number): Uint8Array {
  const buf = new Uint8Array(size);
  // Fill with pseudo-random data so it can't be compressed easily
  for (let i = 0; i < size; i++) {
    buf[i] = (i * 1664525 + 1013904223) & 0xff;
  }
  return buf;
}

export async function GET(_req: NextRequest) {
  const data = generateRandomBytes(CHUNK_SIZE);

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(data.byteLength),
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
