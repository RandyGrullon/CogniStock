import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con service-role para uso server-side (API Routes / cron).
 * NUNCA exponer al navegador.
 */
let cached: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL y SUPABASE_SERVICE_KEY (o SUPABASE_KEY) son requeridos en el entorno"
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
