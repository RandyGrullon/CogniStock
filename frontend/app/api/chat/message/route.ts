import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { groqChat, getGroqModel } from "@/lib/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { message, history, session_id, started_at } = await request.json();
    const db = getServerSupabase();

    // Contexto desde Supabase
    const [{ data: portfolio }, { data: lessons }, { data: openTrades }] = await Promise.all([
      db.from("portafolio").select("*").eq("id", 1).single(),
      db.from("lecciones").select("*").order("fecha", { ascending: false }).limit(5),
      db.from("trades").select("*").eq("estado", "OPEN"),
    ]);

    const contextSummary = `
SISTEMA COGNISTOCK - ESTADO ACTUAL:
- Patrimonio Neto: $${portfolio?.capital_total ?? 0}
- Efectivo Disponible: $${portfolio?.capital_disponible ?? 0}
- Posiciones Abiertas: ${openTrades?.length ?? 0}
- Lecciones recientes: ${(lessons ?? []).map((l: any) => l.titulo).join(" | ") || "ninguna"}
`;

    const systemPrompt = `${contextSummary}
Eres 'CogniStock AI', el núcleo de inteligencia de esta terminal de trading.
Tu tono es ejecutivo, analítico y directo. Responde basado en datos REALES.`;

    const formatted = [
      { role: "system" as const, content: systemPrompt },
      ...((history ?? []) as any[]).map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: String(m.content ?? ""),
      })),
      { role: "user" as const, content: String(message ?? "") },
    ];

    const response = await groqChat(formatted, { temperature: 0.7, model: getGroqModel() });

    // Persistir mensajes (user + assistant) y upsert de la sesión (best-effort)
    if (session_id) {
      try {
        const nowIso = new Date().toISOString();
        await db.from("chat_messages").insert([
          { session_id, role: "user", content: String(message ?? ""), ts: nowIso },
          { session_id, role: "assistant", content: response, ts: nowIso },
        ]).throwOnError();

        const startedIso = started_at ?? nowIso;
        // upsert simplificado: si la sesión ya existe, solo actualizamos message_count via incremento
        const { data: existing, error: selErr } = await db
          .from("chat_sessions")
          .select("id, message_count")
          .eq("session_id", session_id)
          .maybeSingle();
        
        if (selErr) throw selErr;

        if (!existing) {
          await db.from("chat_sessions").insert({
            session_id,
            started_at: startedIso,
            message_count: 2,
          }).throwOnError();
        } else {
          await db
            .from("chat_sessions")
            .update({ message_count: (existing.message_count ?? 0) + 2 })
            .eq("session_id", session_id)
            .throwOnError();
        }
      } catch (logErr) {
        console.error("chat log error:", logErr);
      }
    }

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("CHAT ERROR:", error);
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
