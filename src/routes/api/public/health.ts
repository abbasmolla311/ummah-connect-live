import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const checks: Record<string, { ok: boolean; detail?: string }> = {};

        const requiredEnv = [
          "SUPABASE_URL",
          "SUPABASE_PUBLISHABLE_KEY",
        ];
        for (const key of requiredEnv) {
          const value = process.env[key];
          checks[`env:${key}`] = { ok: !!value, detail: value ? "set" : "missing" };
        }

        // Test Supabase reachability via REST
        try {
          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (url && key) {
            const res = await fetch(`${url}/auth/v1/health`, {
              headers: { apikey: key },
            });
            checks["supabase:auth"] = {
              ok: res.ok,
              detail: `HTTP ${res.status}`,
            };
          } else {
            checks["supabase:auth"] = { ok: false, detail: "env missing" };
          }
        } catch (err) {
          checks["supabase:auth"] = {
            ok: false,
            detail: err instanceof Error ? err.message : String(err),
          };
        }

        const allOk = Object.values(checks).every((c) => c.ok);
        return Response.json(
          {
            status: allOk ? "ok" : "degraded",
            timestamp: new Date().toISOString(),
            checks,
          },
          { status: allOk ? 200 : 503 },
        );
      },
    },
  },
});
