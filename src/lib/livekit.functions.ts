import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AccessToken } from "livekit-server-sdk";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roomSchema = z.object({
  mosqueId: z.string().uuid(),
  role: z.enum(["broadcaster", "listener"]),
});

/**
 * Issue a LiveKit access token. Broadcaster path requires auth (mosque owner / admin only).
 * Listener path is open to anyone so visitors can tune in.
 */
export const issueLiveKitToken = createServerFn({ method: "POST" })
  .inputValidator((d) => roomSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_WS_URL;
    if (!apiKey || !apiSecret || !wsUrl) {
      throw new Error("LiveKit not configured");
    }

    const room = `mosque_${data.mosqueId}`;
    const identity = `${data.role}_${crypto.randomUUID()}`;
    const at = new AccessToken(apiKey, apiSecret, { identity, ttl: 60 * 60 });
    at.addGrant({
      room,
      roomJoin: true,
      canPublish: data.role === "broadcaster",
      canSubscribe: true,
      canPublishData: false,
    });
    const token = await at.toJwt();
    return { token, wsUrl, room };
  });

/** Broadcaster guard — verify the caller owns the mosque before issuing publish token. */
export const issueBroadcasterToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ mosqueId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: mosque, error } = await supabase
      .from("mosques")
      .select("id, owner_id")
      .eq("id", data.mosqueId)
      .single();
    if (error || !mosque) throw new Error("Mosque not found");
    if (mosque.owner_id !== userId) throw new Error("Not authorized");

    const apiKey = process.env.LIVEKIT_API_KEY!;
    const apiSecret = process.env.LIVEKIT_API_SECRET!;
    const wsUrl = process.env.LIVEKIT_WS_URL!;
    const room = `mosque_${data.mosqueId}`;
    const at = new AccessToken(apiKey, apiSecret, {
      identity: `broadcaster_${userId}`,
      ttl: 60 * 60,
    });
    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });
    return { token: await at.toJwt(), wsUrl, room };
  });
