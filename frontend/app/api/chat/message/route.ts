import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    // 1. Get Context
    const { data: portfolio } = await supabase.from('portafolio').select('*').eq('id', 1).single();
    const { data: lessons } = await supabase.from('lecciones').select('*').order('fecha', { ascending: false }).limit(5);
    const { data: openTrades } = await supabase.from('trades').select('*').eq('estado', 'OPEN');

    const contextSummary = `
      SISTEMA COGNISTOCK - ESTADO ACTUAL:
      - Patrimonio Neto: $${portfolio?.capital_total || 0}
      - Efectivo: $${portfolio?.capital_disponible || 0}
      - Posiciones Abiertas: ${openTrades?.length || 0} tickers
    `;

    const systemPrompt = `
      ${contextSummary}
      Eres 'CogniStock AI', el núcleo de inteligencia de esta terminal de trading.
      Tu tono es ejecutivo, analítico y directo. Responde basado en datos REALES.
    `;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: formattedMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    return NextResponse.json({ response: chatCompletion.choices[0].message.content });
  } catch (error: any) {
    console.error('CHAT ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
