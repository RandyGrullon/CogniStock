import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPortfolioStatus } from "@/lib/portfolio";
import { generateDailyReview } from "@/lib/groq";
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
  const result = await withCronRun("close-day", { fecha: todayUtc() }, async () => {
    const db = getServerSupabase();
    const fecha = todayUtc();

    const { data: summary } = await db
      .from("daily_summaries")
      .select("*")
      .eq("fecha", fecha)
      .maybeSingle();
    if (!summary) return { skipped: "no-summary-for-today" };
    if (summary.estado === "COMPLETED") return { skipped: "already-closed" };

    const portfolio = await getPortfolioStatus();
    const { data: recent } = await db
      .from("analisis")
      .select("ticker, recomendacion, confianza, fecha")
      .gte("fecha", `${fecha}T00:00:00Z`)
      .order("fecha", { ascending: false })
      .limit(20);

    let intentionsObj: any = { intencion: summary.intencion, objetivos: summary.objetivos };
    try {
      intentionsObj.objetivos = JSON.parse(summary.objetivos);
    } catch {
      // keep as is
    }
    const review = await generateDailyReview(intentionsObj, { recent, portfolio }, "");
    await db
      .from("daily_summaries")
      .update({
        resultado: review.resultado,
        obstaculos: review.obstaculos,
        lecciones: review.lecciones,
        estado: "COMPLETED",
        closed_at: new Date().toISOString(),
      })
      .eq("fecha", fecha)
      .throwOnError();
    return { closed: fecha };
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
