import { z } from "zod";

export const assetEventSchema = z.object({
  playerId: z.string().min(1),
  assetId: z.string().min(1),
  event: z.enum(["asset_published", "live_event_reported"]),
  moderationQueue: z.string().min(1),
});

export type AssetEvent = z.infer<typeof assetEventSchema>;

export type SessionEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: Record<string, unknown>;
};

export type SessionGateway = {
  refresh(refreshToken: string): Promise<{ sessionId: string; accessToken: string }>;
  revoke(sessionId: string): Promise<void>;
};

export function shouldRevokeSession(event: AssetEvent): boolean {
  return event.event === "live_event_reported";
}

export async function rotateAndModerate(
  gateway: SessionGateway,
  input: unknown,
): Promise<{ sessionId: string; queued: boolean }> {
  const event = assetEventSchema.parse(input);
  const refreshed = await gateway.refresh(process.env.INFRAI_REFRESH_TOKEN ?? "");
  const queued = event.moderationQueue.length > 0;
  if (shouldRevokeSession(event)) await gateway.revoke(refreshed.sessionId);
  return { sessionId: refreshed.sessionId, queued };
}
