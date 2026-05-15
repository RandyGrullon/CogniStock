import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getServerSupabase } from "@/lib/supabase/server";
import { summarizeChatSession } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { session_id, history, started_at, ended_at } = await request.json();
    if (!session_id) {
      return NextResponse.json({ error: "session_id requerido" }, { status: 400 });
    }
    const db = getServerSupabase();

    const transcript = Array.isArray(history) ? history : [];
    const endedIso = ended_at ?? new Date().toISOString();
    const startedIso = started_at ?? endedIso;
    const duration = Math.max(
      0,
      Math.floor((new Date(endedIso).getTime() - new Date(startedIso).getTime()) / 1000)
    );

    let summaryJson: any = null;
    if (transcript.length >= 2) {
      try {
        summaryJson = await summarizeChatSession(transcript);
      } catch (e) {
        console.error("summary error:", e);
      }
    }

    // Upsert sobre chat_sessions
    const { data: existing } = await db
      .from("chat_sessions")
      .select("id")
      .eq("session_id", session_id)
      .maybeSingle();
    const payload = {
      session_id,
      started_at: startedIso,
      ended_at: endedIso,
      duration_seconds: duration,
      message_count: transcript.length,
      transcript,
      summary: summaryJson,
      sentiment: summaryJson?.sentiment ?? null,
    };
    if (existing) {
      await db.from("chat_sessions").update(payload).eq("session_id", session_id);
    } else {
      await db.from("chat_sessions").insert(payload);
    }

    return NextResponse.json({ status: "success", duration_seconds: duration });
  } catch (error: any) {
    console.error("END SESSION ERROR:", error);
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
