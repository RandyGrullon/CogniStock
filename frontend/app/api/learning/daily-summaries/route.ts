import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "10");
    const db = getServerSupabase();
    const { data, error } = await db
      .from("daily_summaries")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return NextResponse.json(data ?? [], {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
