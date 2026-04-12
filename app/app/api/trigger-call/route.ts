export const runtime = "nodejs";

import { NextResponse } from "next/server";

const TIMEOUT_MS = 15_000;

export async function POST() {
  const privateKey = process.env.VAPI_PRIVATE_KEY;
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  const demoPhone = process.env.DEMO_PHONE_NUMBER;

  if (!privateKey || !assistantId || !phoneNumberId || !demoPhone) {
    return NextResponse.json(
      { error: "Vapi not configured" },
      { status: 500 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${privateKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId,
        phoneNumberId,
        customer: {
          number: demoPhone,
        },
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return NextResponse.json(
        { error: "Vapi error", detail },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Vapi timeout" }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}
