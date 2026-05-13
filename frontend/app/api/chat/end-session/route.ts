import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Groq } from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { session_id, history } = await request.json();

    if (!history || history.length < 2) {
      return NextResponse.json({ status: 'empty' });
    }

    const summaryPrompt = `
      Eres un auditor de sistemas experto. Resume esta sesión de trading entre el usuario y la IA CogniStock.
      CONVERSACIÓN: ${JSON.stringify(history)}
      
      Genera un JSON con este formato exacto:
      {
          "ticker": "CHAT",
          "recomendacion": "SUMMARY",
          "confianza": 100,
          "nivel_riesgo": "N/A",
          "razonamiento": "Resumen detallado de los puntos clave...",
          "riesgos": ["temas discutidos"]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: summaryPrompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const summaryData = JSON.parse(chatCompletion.choices[0].message.content || '{}');

    const logEntry = {
      id: uuidv4(),
      ticker: "CHAT",
      fecha: new Date().toISOString(),
      recomendacion: summaryData.recomendacion || "SUMMARY",
      confianza: 100,
      nivel_riesgo: "N/A",
      razonamiento: summaryData.razonamiento || "Chat Session",
      riesgos: Array.isArray(summaryData.riesgos) ? summaryData.riesgos : [],
      datos_tecnicos: "Reporte de Sesión Neural",
      datos_fundamentales: `ID: ${session_id}`
    };

    const { error } = await supabase.from('analisis').insert([logEntry]);
    if (error) throw error;

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('END SESSION ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
