import { NextResponse } from "next/server";
import { updateOpenTradesPnl } from "@/lib/portfolio";
import { assertCronAuthorized, withCronRun } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    assertCronAuthorized(req);
  } catch (resp: any) {
    return resp instanceof Response ? resp : NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await withCronRun("update-pnl", null, () => updateOpenTradesPnl());
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
