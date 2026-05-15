/**
 * Helpers para Vercel Cron Jobs.
 *
 * - assertCronAuthorized: valida el header `Authorization: Bearer <CRON_SECRET>`
 *   que Vercel envía automáticamente cuando configuras CRON_SECRET en env.
 *   En desarrollo puedes bypassear con ALLOW_INSECURE_CRON=1.
 * - withCronRun: envuelve un handler y registra start/finish/error en cron_runs.
 */

import { v4 as uuidv4 } from "uuid";
import { getServerSupabase } from "./supabase/server";

export function assertCronAuthorized(req: Request): void {
  if (process.env.ALLOW_INSECURE_CRON === "1") return;
  const secret = process.env.CRON_SECRET;
  if (!secret) return; // si no hay secret configurado, no exigimos auth (dev)
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) {
    throw new Response("Unauthorized", { status: 401 } as any);
  }
}

export async function withCronRun<T>(
  jobName: string,
  payload: any,
  fn: () => Promise<T>
): Promise<{ ok: boolean; result?: T; error?: string; run_id: string }> {
  const db = getServerSupabase();
  const run_id = uuidv4();
  await db
    .from("cron_runs")
    .insert({ id: run_id, job_name: jobName, payload, status: "RUNNING" })
    .throwOnError();
  try {
    const result = await fn();
    await db
      .from("cron_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: "SUCCESS",
        payload: { ...(payload ?? {}), result },
      })
      .eq("id", run_id);
    return { ok: true, result, run_id };
  } catch (e: any) {
    await db
      .from("cron_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: "ERROR",
        error: e?.message ?? String(e),
      })
      .eq("id", run_id);
    return { ok: false, error: e?.message ?? String(e), run_id };
  }
}
