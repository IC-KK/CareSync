export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

const TIMEOUT_MS = 10_000;

export async function POST(req: NextRequest) {
  const url = process.env.RENDER_API_URL;
  const key = process.env.RENDER_API_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(`${url}/predict-preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return NextResponse.json(
        { error: "Upstream error", detail },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Upstream timeout" }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}
