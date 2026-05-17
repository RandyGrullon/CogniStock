import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getGroqModel } from "@/lib/groq";
import { isMarketOpen } from "@/lib/marketHours";
import { executeTrade } from "@/lib/portfolio";
import Groq from "groq-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { message, history, session_id, started_at } = await request.json();
    const db = getServerSupabase();

    // 1. Obtener contexto del sistema
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [{ data: portfolio }, { data: lessons }, { data: openTrades }, { count: tradesToday }] = await Promise.all([
      db.from("portafolio").select("*").eq("id", 1).single(),
      db.from("lecciones").select("*").order("fecha", { ascending: false }).limit(5),
      db.from("trades").select("*").eq("estado", "OPEN"),
      db.from("trades").select("*", { count: 'exact', head: true }).gte("fecha_entrada", todayStart.toISOString())
    ]);

    const contextSummary = `
SISTEMA COGNISTOCK - ESTADO ACTUAL:
- Patrimonio Neto: $${portfolio?.capital_total ?? 0}
- Efectivo Disponible: $${portfolio?.capital_disponible ?? 0}
- Posiciones Abiertas: ${openTrades?.length ?? 0}
- Operaciones realizadas hoy: ${tradesToday ?? 0}/5
- Lecciones recientes: ${(lessons ?? []).map((l: any) => l.titulo).join(" | ") || "ninguna"}
`;

    // 2. Verificar estado global del mercado (para SPY como proxy)
    const { isOpen: globalMarketOpen, reason: globalMarketReason } = isMarketOpen("SPY");

    const systemPrompt = `${contextSummary}
Eres 'CogniStock AI', el núcleo de inteligencia de esta terminal de trading.
Tu misión suprema es gestionar la operativa y el análisis técnico con un objetivo innegociable: **LLEVAR EL CAPITAL ACTUAL A $1,000,000 USD.**

CONSIDERACIONES CRÍTICAS DE MENTALIDAD:
- **RECURSOS FINITOS:** Ten presente en todo momento que el dinero en la cuenta es TODO el capital disponible. No hay margen para errores por descuido.
- **MISIÓN MILLÓN:** Cada decisión, análisis y trade debe estar alineado con la meta de alcanzar el millón de dólares.
- **PRECISIÓN QUIRÚRGICA:** Tu análisis debe ser extremadamente preciso. Solo busca setups de alta probabilidad.
- **LÍMITE DIARIO:** Solo tienes permitido abrir **5 operaciones al día**. Es vital elegir solo las mejores oportunidades.

ESTADO DEL MERCADO: ${globalMarketOpen ? "ABIERTO" : "CERRADO (" + globalMarketReason + ")"}

REGLAS DE OPERACIÓN:
1. ANÁLISIS PREVIO: Si el usuario pide operar, realiza un análisis técnico exhaustivo (Soportes, Resistencias, RSI, MACD, Volumen).
2. GESTIÓN DE RIESGO: Como es tu único capital, protege las pérdidas con rigor institucional.
3. VERIFICACIÓN DE HORARIO: Solo usa 'execute_trade' si el mercado está ABIERTO.
4. LÍMITE DE CUOTA: Si ya has realizado 5 operaciones hoy (${tradesToday}/5), NO abras más posiciones y explica al usuario que has agotado tu cuota diaria de alta precisión.
5. EXPLICACIÓN: Detalla siempre el razonamiento técnico y cómo este paso te acerca a la meta del millón.
6. TONO: Ejecutivo, visionario, altamente analítico y protector del patrimonio.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...((history ?? []) as any[]).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content ?? ""),
      })),
      { role: "user", content: String(message ?? "") },
    ];

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: "Configuración incompleta.", 
        details: "La clave API de Groq (GROQ_API_KEY) no está configurada en el servidor." 
      }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const tools = [
      {
        type: "function",
        function: {
          name: "execute_trade",
          description: "Abre una posición real en el mercado. Solo usar si el análisis técnico es favorable y el mercado está abierto.",
          parameters: {
            type: "object",
            properties: {
              ticker: { type: "string", description: "Ticker del activo (ej: AAPL, BTCUSD)" },
              side: { type: "string", enum: ["BUY", "SELL"], description: "Dirección de la orden" },
              amount: { type: "number", description: "Cantidad de unidades" },
              reasoning: { type: "string", description: "Breve resumen del motivo técnico de la entrada" }
            },
            required: ["ticker", "side", "amount", "reasoning"]
          }
        }
      }
    ];

    // --- PRIMERA LLAMADA (Análisis y posibles Herramientas) ---
    const completion1 = await groq.chat.completions.create({
      messages,
      model: getGroqModel(),
      temperature: 0.5,
      tools: tools as any,
      tool_choice: "auto",
    });

    const responseMsg = completion1.choices[0]?.message;

    if (responseMsg?.tool_calls && responseMsg.tool_calls.length > 0) {
      messages.push(responseMsg);
      
      for (const toolCall of responseMsg.tool_calls) {
        if (toolCall.function.name === "execute_trade") {
          const args = JSON.parse(toolCall.function.arguments);
          const ticker = args.ticker.toUpperCase();
          
          // Doble verificación de horario antes de llamar a la lib
          const { isOpen } = isMarketOpen(ticker);
          
          if (!isOpen) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "execute_trade",
              content: JSON.stringify({ error: "No se puede ejecutar: El mercado está cerrado para este activo." })
            });
            continue;
          }

          try {
            const res = await executeTrade({
              ticker,
              side: args.side,
              amount: args.amount,
              reasoning: `[AI CHAT] ${args.reasoning || 'Ejecución solicitada vía terminal neural.'}`
            });
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "execute_trade",
              content: JSON.stringify(res)
            });
          } catch (e: any) {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "execute_trade",
              content: JSON.stringify({ error: e.message })
            });
          }
        }
      }
      
      // --- SEGUNDA LLAMADA (Respuesta Final al Usuario) ---
      const completion2 = await groq.chat.completions.create({
        messages,
        model: getGroqModel(),
        temperature: 0.5,
      });
      
      var finalResponse = completion2.choices[0]?.message?.content || "Análisis completado y registrado.";
    } else {
      var finalResponse = responseMsg?.content || "Sincronización de datos fallida.";
    }

    const response = finalResponse;

    // 3. Persistir interacción
    if (session_id) {
      try {
        const nowIso = new Date().toISOString();
        await db.from("chat_messages").insert([
          { session_id, role: "user", content: String(message ?? ""), ts: nowIso },
          { session_id, role: "assistant", content: response, ts: nowIso },
        ]);

        const { data: existing } = await db.from("chat_sessions").select("message_count").eq("session_id", session_id).maybeSingle();
        if (!existing) {
          await db.from("chat_sessions").insert({ session_id, started_at: started_at ?? nowIso, message_count: 2 });
        } else {
          await db.from("chat_sessions").update({ message_count: (existing.message_count ?? 0) + 2 }).eq("session_id", session_id);
        }
      } catch (logErr) {
        console.error("Chat persistence error:", logErr);
      }
    }

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("CRITICAL CHAT ERROR:", error);
    return NextResponse.json({ 
      error: "Error interno del núcleo neural.", 
      details: error?.message || String(error) 
    }, { status: 500 });
  }
}
