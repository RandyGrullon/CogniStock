import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPortfolioStatus } from "@/lib/portfolio";
import { generateDailyReview } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST() {
  try {
    const db = getServerSupabase();
    const fecha = todayUtc();

    const { data: summary, error: e1 } = await db
      .from("daily_summaries")
      .select("*")
      .eq("fecha", fecha)
      .maybeSingle();
    if (e1) throw e1;
    if (!summary) {
      return NextResponse.json({ error: "No hay intención de apertura para hoy." }, { status: 404 });
    }
    if (summary.estado === "COMPLETED") return NextResponse.json(summary);

    const portfolio = await getPortfolioStatus();
    const { data: recent } = await db
      .from("analisis")
      .select("ticker, recomendacion, confianza, fecha, razonamiento")
      .gte("fecha", `${fecha}T00:00:00Z`)
      .order("fecha", { ascending: false })
      .limit(20);

    let intentionsObj: any = { intencion: summary.intencion, objetivos: summary.objetivos };
    try {
      intentionsObj.objetivos = JSON.parse(summary.objetivos);
    } catch {
      // keep as string
    }

    const review = await generateDailyReview(intentionsObj, { recent, portfolio }, "");

    const updates = {
      resultado: review.resultado,
      obstaculos: review.obstaculos,
      lecciones: review.lecciones,
      estado: "COMPLETED",
      closed_at: new Date().toISOString(),
    };
    const { error: e2 } = await db.from("daily_summaries").update(updates).eq("fecha", fecha);
    if (e2) throw e2;

    return NextResponse.json({ ...summary, ...updates });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
