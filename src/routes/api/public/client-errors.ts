import { createFileRoute } from "@tanstack/react-router";

// Lightweight client error sink — frontend POSTs errors here and they appear in server logs.
export const Route = createFileRoute("/api/public/client-errors")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const ua = request.headers.get("user-agent") ?? "unknown";
          // Single-line structured log so it's easy to grep in server logs.
          console.error(
            "[client-error]",
            JSON.stringify({
              ...body,
              userAgent: ua,
              receivedAt: new Date().toISOString(),
            }),
          );
          return Response.json({ received: true });
        } catch (err) {
          console.error("[client-error] failed to parse", err);
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
