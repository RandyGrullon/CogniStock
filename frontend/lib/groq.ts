import Groq from "groq-sdk";

let cached: Groq | null = null;

function client(): Groq {
  if (cached) return cached;
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY no configurada");
  cached = new Groq({ apiKey: key });
  return cached;
}

export function getGroqModel(): string {
  return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
}

/** Llamada de chat genérica que devuelve string. */
export async function groqChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { temperature?: number; maxTokens?: number; model?: string } = {}
): Promise<string> {
  const completion = await client().chat.completions.create({
    messages: messages as any,
    model: opts.model || getGroqModel(),
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1000,
  });
  return completion.choices[0]?.message?.content ?? "";
}

/** Llamada de chat que devuelve JSON parseado (response_format json_object). */
export async function groqJson<T = any>(
  messages: any[],
  opts: { temperature?: number; model?: string } = {}
): Promise<T> {
  const completion = await client().chat.completions.create({
    messages: messages as any,
    model: opts.model || getGroqModel(),
    temperature: opts.temperature ?? 0.4,
    response_format: { type: "json_object" },
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as T;
}

// ---------------------------------------------------------------------------
// Prompts portados de backend/core/ai_client.py
// ---------------------------------------------------------------------------

export type AnalysisResult = {
  recomendacion: "BUY" | "SELL" | "HOLD" | "WATCH";
  confianza: number;
  nivel_riesgo: "BAJO" | "MEDIO" | "ALTO";
  razonamiento: string;
  riesgos: string[];
  precio_objetivo: number;
  stop_loss: number;
  horizonte: string;
  lecciones_aplicadas: string[];
};

export async function analyzeStock(input: {
  ticker: string;
  technical: Record<string, any>;
  fundamentals: Record<string, any>;
  news: any[];
  memory: string;
  image?: string;
}): Promise<AnalysisResult> {
  const prompt = `
Eres un analista financiero experto de élite. Tu objetivo es aprender de experiencias pasadas y mejorar tus predicciones.

Analiza ${input.ticker} con la siguiente información:

=== MEMORIA HISTÓRICA (Lecciones aprendidas de trades pasados) ===
${input.memory}

=== ANÁLISIS TÉCNICO ===
${JSON.stringify(input.technical, null, 2)}

=== FUNDAMENTALES ===
${JSON.stringify(input.fundamentals, null, 2)}

=== NOTICIAS RECIENTES ===
${JSON.stringify(input.news, null, 2)}

Instrucciones Cruciales:
1. REVISA la memoria histórica. Si cometiste errores similares en el pasado, NO los repitas.
2. Analiza si el patrón técnico actual coincide con lecciones de "SUCCESS" o "ERROR".
3. Da una recomendación clara: BUY, SELL, HOLD, o WATCH.
4. Indica tu nivel de confianza (0-100).
5. Explica tu razonamiento integrando lo que has aprendido.

Responde ÚNICAMENTE en JSON con esta estructura:
{
  "recomendacion": "BUY|SELL|HOLD|WATCH",
  "confianza": 0-100,
  "nivel_riesgo": "BAJO|MEDIO|ALTO",
  "razonamiento": "texto detallado",
  "riesgos": ["riesgo1", "riesgo2"],
  "precio_objetivo": número,
  "stop_loss": número,
  "horizonte": "corto|mediano|largo plazo",
  "lecciones_aplicadas": ["título de la lección que usaste para decidir"]
}
`;
  let userContent: any = prompt;
  let modelOverride: string | undefined = undefined;
  
  if (input.image) {
    userContent = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: input.image } }
    ];
    modelOverride = "llama-3.2-11b-vision-preview";
  }

  return groqJson<AnalysisResult>([
    {
      role: "system",
      content:
        "Eres un sistema de análisis financiero con capacidad de aprendizaje continuo. Tu prioridad es la gestión de riesgo y la mejora constante basada en datos históricos.",
    },
    { role: "user", content: userContent },
  ], { model: modelOverride });
}

export type LessonResult = {
  tipo: "SUCCESS" | "ERROR" | "NEUTRAL";
  titulo: string;
  leccion: string;
  tags: string[];
  patron: string;
  aplicar_cuando: string;
  estrellas: number;
};

export async function generateLesson(
  trade: any,
  outcome: { pnl: number; pnl_porcentaje: number; contexto_mercado?: string }
): Promise<LessonResult> {
  const prompt = `
Como sistema de aprendizaje, analiza este trade CERRADO para extraer una lección que mejore tu desempeño futuro.

DATOS DEL TRADE:
- Ticker: ${trade.ticker}
- Entrada: $${trade.precio_entrada} (${trade.fecha_entrada})
- Salida: $${trade.precio_salida} (${trade.fecha_salida})
- P&L: ${outcome.pnl_porcentaje}% ($${outcome.pnl})
- Tu razonamiento original: ${trade.razonamiento}

CONTEXTO DEL MERCADO AL CERRAR:
${outcome.contexto_mercado ?? "No disponible"}

Crea una lección estructurada en JSON para tu memoria a largo plazo:
{
  "tipo": "SUCCESS|ERROR|NEUTRAL",
  "titulo": "Resumen de la lección (máx 10 palabras)",
  "leccion": "Explicación profunda de por qué se ganó o perdió y qué patrón evitar o repetir",
  "tags": ["${trade.ticker}", "sector", "tipo_de_fallo_o_acierto"],
  "patron": "Nombre del patrón técnico/fundamental identificado",
  "aplicar_cuando": "Condiciones específicas para aplicar esta lección en el futuro",
  "estrellas": 1-5
}
`;
  return groqJson<LessonResult>([
    {
      role: "system",
      content:
        "Eres un motor de aprendizaje automático humano-céntrico especializado en mercados financieros.",
    },
    { role: "user", content: prompt },
  ]);
}

export type DailyIntentions = { intencion: string; objetivos: string[] };

export async function generateDailyIntentions(
  portfolio: any,
  marketContext: string
): Promise<DailyIntentions> {
  const prompt = `
Hoy abre el mercado. Como analista jefe, define tu estrategia y objetivos para el día.

ESTADO DEL PORTAFOLIO:
${JSON.stringify(portfolio, null, 2)}

CONTEXTO GENERAL DEL MERCADO:
${marketContext}

Responde en JSON con esta estructura:
{
  "intencion": "Una frase poderosa sobre la postura de hoy (ej: Defensiva, Agresiva en Tech...)",
  "objetivos": ["objetivo 1", "objetivo 2", "objetivo 3"]
}
`;
  return groqJson<DailyIntentions>([
    { role: "system", content: "Eres un estratega financiero disciplinado." },
    { role: "user", content: prompt },
  ]);
}

export type DailyReview = {
  resultado: string;
  obstaculos: string;
  lecciones: string;
};

export async function generateDailyReview(
  intentions: any,
  results: any,
  marketContext: string
): Promise<DailyReview> {
  const prompt = `
El mercado ha cerrado. Analiza si cumpliste tus objetivos de hoy.

INTENCIONES DE ESTA MAÑANA:
${intentions?.intencion ?? "N/A"}
OBJETIVOS: ${intentions?.objetivos ?? "N/A"}

RESULTADOS DEL DÍA:
${JSON.stringify(results, null, 2)}

CONTEXTO DEL MERCADO AL CIERRE:
${marketContext}

Responde en JSON:
{
  "resultado": "Resumen de lo que lograste hoy",
  "obstaculos": "Qué te impidió cumplir todos tus objetivos (si aplica)",
  "lecciones": "Qué has aprendido hoy específicamente de este comportamiento"
}
`;
  return groqJson<DailyReview>([
    { role: "system", content: "Eres un analista autocrítico que busca la mejora continua." },
    { role: "user", content: prompt },
  ]);
}

export type PreActionPlan = {
  planned_action: string;
  rationale: string;
  expected_outcome: string;
  confidence: number;
};

export async function generatePreActionPlan(input: {
  ticker: string;
  market_snapshot: Record<string, any>;
  memory: string;
}): Promise<PreActionPlan> {
  const prompt = `
Eres CogniStock AI. En unos minutos vas a analizar ${input.ticker} y posiblemente operar.
ANTES de tomar la decisión, escribe lo que planeas hacer y qué esperas ver.

SNAPSHOT DEL MERCADO AHORA:
${JSON.stringify(input.market_snapshot, null, 2)}

MEMORIA HISTÓRICA:
${input.memory}

Responde en JSON:
{
  "planned_action": "BUY|SELL|HOLD|WATCH (lo que planeas hacer si confirma la señal)",
  "rationale": "Por qué crees que será esa acción y bajo qué condiciones",
  "expected_outcome": "Qué esperas ver pasar después",
  "confidence": 0-100
}
`;
  return groqJson<PreActionPlan>([
    {
      role: "system",
      content:
        "Eres CogniStock: una IA disciplinada que documenta su tesis ANTES de operar, no después.",
    },
    { role: "user", content: prompt },
  ]);
}

export type PostActionReflection = {
  result: string;
  lessons: string;
};

export async function generatePostActionReflection(input: {
  ticker: string;
  planned: PreActionPlan;
  executed: any;
}): Promise<PostActionReflection> {
  const prompt = `
Acabas de ejecutar (o decidir NO ejecutar) sobre ${input.ticker}.

LO QUE PLANEABAS HACER:
${JSON.stringify(input.planned, null, 2)}

LO QUE FINALMENTE HICISTE / DECIDISTE:
${JSON.stringify(input.executed, null, 2)}

Reflexiona en JSON:
{
  "result": "Qué pasó realmente vs tu plan (1-3 frases)",
  "lessons": "Qué aprendiste específicamente para la próxima vez"
}
`;
  return groqJson<PostActionReflection>([
    {
      role: "system",
      content: "Eres CogniStock evaluando tu propio razonamiento minutos después de ejecutar.",
    },
    { role: "user", content: prompt },
  ]);
}

export type ChatSessionSummary = {
  summary: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  topics: string[];
  next_actions: string[];
};

export async function summarizeChatSession(
  transcript: { role: string; content: string }[]
): Promise<ChatSessionSummary> {
  const prompt = `
Eres un auditor de sistemas experto. Resume esta sesión de trading entre el usuario y la IA CogniStock.

CONVERSACIÓN:
${JSON.stringify(transcript)}

Genera un JSON con este formato exacto:
{
  "summary": "Resumen detallado de los puntos clave de la conversación",
  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "topics": ["tema 1", "tema 2"],
  "next_actions": ["acción de seguimiento 1", "acción 2"]
}
`;
  return groqJson<ChatSessionSummary>([{ role: "user", content: prompt }]);
}
