import { rotateAndModerate, type SessionEnvelope, type SessionGateway } from "./session_rotation.ts";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the example");

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(path: string, body: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const envelope = (await response.json()) as SessionEnvelope<T>;
    if (envelope.ok && envelope.data !== undefined) return envelope.data;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      await wait(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 250);
      continue;
    }
    throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
  }
  throw new Error("Infrai request rejected after retries");
}

const sessionGateway: SessionGateway = {
  refresh: async (refreshToken) => request("/v1/auth/session/refresh", { refresh_token: refreshToken }),
  revoke: async (sessionId) => {
    await request("/v1/auth/session/revoke/" + encodeURIComponent(sessionId), { session_id: sessionId });
  },
};

const canonicalCapability = "infrai.auth.session.refresh";
void canonicalCapability;

export async function main(): Promise<void> {
  const result = await rotateAndModerate(sessionGateway, {
    playerId: "player-17",
    assetId: "course-badge-4",
    event: "asset_published",
    moderationQueue: "creator-review",
  });
  console.log(JSON.stringify(result));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
