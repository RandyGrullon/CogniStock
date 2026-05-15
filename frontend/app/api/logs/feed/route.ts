import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const TABLES: Record<string, { table: string; order: string }> = {
  analisis: { table: "analisis", order: "fecha" },
  trades: { table: "trades", order: "fecha_entrada" },
  lecciones: { table: "lecciones", order: "fecha" },
  daily_summaries: { table: "daily_summaries", order: "created_at" },
  chat_sessions: { table: "chat_sessions", order: "started_at" },
  pre_action_logs: { table: "pre_action_logs", order: "scheduled_at" },
  post_action_logs: { table: "post_action_logs", order: "ts" },
  cron_runs: { table: "cron_runs", order: "started_at" },
  market_ticks: { table: "market_ticks", order: "ts" },
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const type = url.searchParams.get("type"); // si quieres solo un tipo
    const db = getServerSupabase();

    const out: Record<string, any[]> = {};
    const entries = type && TABLES[type] ? [[type, TABLES[type]] as const] : Object.entries(TABLES);

    await Promise.all(
      entries.map(async ([key, cfg]) => {
        const { data, error } = await db
          .from(cfg.table)
          .select("*")
          .order(cfg.order, { ascending: false })
          .limit(limit);
        if (error) {
          console.error(`Error fetching ${key}:`, error);
          throw error;
        }
        out[key] = data ?? [];
      })
    );

    return NextResponse.json(out, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
