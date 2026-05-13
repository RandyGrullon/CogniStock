import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('analisis')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(10);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
