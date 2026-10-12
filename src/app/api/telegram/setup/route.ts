import { NextResponse } from "next/server";
import { getWebhookInfo, setWebhook } from "@/lib/telegram";

// Registers the Telegram webhook (with callback_query enabled) for this
// deployment. Call once: GET /api/telegram/setup with `Authorization: Bearer $CRON_SECRET`
// or `?secret=$CRON_SECRET`. Without ?register=1 it only reports the current state.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || (auth !== `Bearer ${expected}` && secret !== expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (url.searchParams.get("register") === "1") {
    const result = await setWebhook(`${url.origin}/api/telegram/webhook`);
    return NextResponse.json({ result, info: await getWebhookInfo() });
  }
  return NextResponse.json({ info: await getWebhookInfo() });
}
