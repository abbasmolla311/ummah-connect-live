import { createFileRoute } from "@tanstack/react-router";

const MAX_BODY_BYTES = 4 * 1024; // 4 KB cap
const clip = (v: unknown, n: number) =>
  v == null ? "" : String(v).slice(0, n);

// Lightweight client error sink — frontend POSTs errors here and they appear in server logs.
// Hardened: body size cap + strict field allowlist so anonymous users can't pollute logs.
export const Route = createFileRoute("/api/public/client-errors")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = await request.text();
          if (raw.length > MAX_BODY_BYTES) {
            return new Response("payload too large", { status: 413 });
          }
          let body: Record<string, unknown> = {};
          try {
            body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
          } catch {
            return new Response("bad request", { status: 400 });
          }
          const ua = request.headers.get("user-agent") ?? "unknown";
          console.error(
            "[client-error]",
            JSON.stringify({
              message: clip(body.message, 500),
              stack: clip(body.stack, 1000),
              componentStack: clip(body.componentStack, 1000),
              url: clip(body.url, 300),
              line: clip(body.line, 20),
              column: clip(body.column, 20),
              userAgent: clip(ua, 300),
              receivedAt: new Date().toISOString(),
            }),
          );
          return Response.json({ received: true });
        } catch (err) {
          console.error("[client-error] handler failure", err);
          return new Response("bad request", { status: 400 });
        }
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type" },
        }),
    },
  },
});
