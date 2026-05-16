import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getServerSupabase();
    const { data, error } = await db
      .from("chat_messages")
      .select("*")
      .order("ts", { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet, return empty
        return NextResponse.json({ messages: [] });
      }
      throw error;
    }

    return NextResponse.json({ messages: data || [] });
  } catch (error: any) {
    console.error("CHAT HISTORY ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
