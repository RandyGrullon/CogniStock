import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPortfolioStatus } from "@/lib/portfolio";
import { generateDailyIntentions } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST() {
  try {
    const db = getServerSupabase();
    const fecha = todayUtc();

    const { data: existing } = await db
      .from("daily_summaries")
      .select("*")
      .eq("fecha", fecha)
      .maybeSingle();
    if (existing) return NextResponse.json(existing);

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
    const { error } = await db.from("daily_summaries").insert(summary);
    if (error) throw error;
    return NextResponse.json(summary);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
