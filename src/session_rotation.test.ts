import test from "node:test";
import assert from "node:assert/strict";
import { rotateAndModerate, type SessionGateway } from "./session_rotation.ts";

test("a reported live event refreshes and revokes the player's session", async () => {
  const calls: string[] = [];
  const gateway: SessionGateway = {
    refresh: async () => { calls.push("refresh"); return { sessionId: "session-7", accessToken: "access-7" }; },
    revoke: async (sessionId) => { calls.push(`revoke:${sessionId}`); },
  };
  const result = await rotateAndModerate(gateway, {
    playerId: "player-17",
    assetId: "asset-2",
    event: "live_event_reported",
    moderationQueue: "safety-review",
  });
  assert.deepEqual(result, { sessionId: "session-7", queued: true });
  assert.deepEqual(calls, ["refresh", "revoke:session-7"]);
});
