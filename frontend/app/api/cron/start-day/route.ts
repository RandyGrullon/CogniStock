import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPortfolioStatus } from "@/lib/portfolio";
import { generateDailyIntentions } from "@/lib/groq";
import { assertCronAuthorized, withCronRun } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  try {
    assertCronAuthorized(req);
  } catch (resp: any) {
    return resp instanceof Response ? resp : NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await withCronRun("start-day", { fecha: todayUtc() }, async () => {
    const db = getServerSupabase();
    const fecha = todayUtc();

    const { data: existing } = await db
      .from("daily_summaries")
      .select("*")
      .eq("fecha", fecha)
      .maybeSingle();
    if (existing) return { skipped: "already-started", id: existing.id };

    const portfolio = await getPortfolioStatus();
    const { data: lessons } = await db
      .from("lecciones")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(10);

    const intentions = await generateDailyIntentions(portfolio, JSON.stringify(lessons ?? []));

    const summary = {
      id: uuidv4(),
      fecha,
      intencion: intentions.intencion,
      objetivos: JSON.stringify(intentions.objetivos),
      resultado: "",
      obstaculos: "",
      lecciones: "",
      estado: "PENDING",
    };
    await db.from("daily_summaries").insert(summary).throwOnError();
    return { created: summary.id, intencion: intentions.intencion };
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
