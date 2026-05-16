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

    const formatted: any[] = [
      { role: "system" as const, content: systemPrompt },
      ...((history ?? []) as any[]).map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: String(m.content ?? ""),
      })),
      { role: "user" as const, content: String(message ?? "") },
    ];

    const { executeTrade } = await import("@/lib/portfolio");
    const { default: Groq } = await import("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const tools = [
      {
        type: "function",
        function: {
          name: "execute_trade",
          description: "Abre una posición de BUY (Largo) o SELL (Corto) en el mercado usando el saldo disponible.",
          parameters: {
            type: "object",
            properties: {
              ticker: { type: "string", description: "Símbolo del activo, ej. AAPL, NVDA" },
              side: { type: "string", enum: ["BUY", "SELL"], description: "Dirección de la operación" },
              amount: { type: "number", description: "Cantidad de acciones o lotes a comprar" }
            },
            required: ["ticker", "side", "amount"]
          }
        }
      }
    ];

    let responseStr = "";
    
    // First call
    const completion1 = await groq.chat.completions.create({
      messages: formatted,
      model: getGroqModel(),
      temperature: 0.7,
      tools: tools as any,
      tool_choice: "auto",
    });

    const responseMsg = completion1.choices[0]?.message;

    if (responseMsg?.tool_calls && responseMsg.tool_calls.length > 0) {
      formatted.push(responseMsg);
      for (const toolCall of responseMsg.tool_calls) {
        if (toolCall.function.name === "execute_trade") {
          const args = JSON.parse(toolCall.function.arguments);
          try {
            const res = await executeTrade({
              ticker: args.ticker.toUpperCase(),
              side: args.side,
              amount: args.amount,
              reasoning: `[CHAT AUTÓNOMO] Solicitado por el usuario vía chat neural.`
            });
            formatted.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "execute_trade",
              content: JSON.stringify(res)
            });
          } catch (e: any) {
            formatted.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "execute_trade",
              content: JSON.stringify({ error: e.message })
            });
          }
        }
      }
      
      // Second call to get final text
      const completion2 = await groq.chat.completions.create({
        messages: formatted,
        model: getGroqModel(),
        temperature: 0.7,
      });
      responseStr = completion2.choices[0]?.message?.content || "Operación ejecutada, pero no pude generar una respuesta.";
    } else {
      responseStr = responseMsg?.content || "Sin respuesta del núcleo.";
    }

    const response = responseStr;

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
