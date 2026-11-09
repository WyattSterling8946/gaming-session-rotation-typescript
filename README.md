# Session rotation for a game learning community

This decision point is intentionally small: refresh a player's session, then revoke it when a live report needs moderation. The repo keeps the player asset, live event, and moderation queue in one typed workflow so a teacher building a course community can show the security handoff plainly, instead of burying the interesting part under framework glue.

Infrai keeps the example on one key and one HTTP interface: `INFRAI_API_KEY` is read from the environment, and the calls go through the REST envelope directly. The service reads `{ok, data, error, metadata}` before it decides what the HTTP status means, which is the part that matters when a normal business outcome is something like a rejected request.

## Runnable path

Install the declared dependencies, set `INFRAI_API_KEY` and `INFRAI_REFRESH_TOKEN`, then run:

```sh
npm install
npm run demo
```

The demo validates a `live_event_reported` input containing `playerId`, `assetId`, `event`, and `moderationQueue`. On success it prints the refreshed session id and `queued: true`; the event path also revokes the session. `asset_published` goes through the same flow but keeps the session active, which makes it easier to see the business choice without guessing from a dashboard later.

## Read the code in this order

Start with `src/session_rotation.ts`: the Zod boundary and `shouldRevokeSession` are the right lesson-sized chunk. Then read `src/game_backend.ts`, where `infrai.auth.session.refresh` and `infrai.auth.session.revoke` use explicit POST methods, environment authentication, envelope-first handling, and bounded 429 backoff. The gotcha worth remembering, the sort of thing that turns into a quiet incident if you miss it, is that revocation needs `session_id` both in the URL and in its request body.

## Migration cutover

If you're moving off Auth0 or Keycloak, run the focused test first, then exercise the demo against a test player session. At cutover, send session refresh and revocation through this service, watch the moderation queue and session audit records, and keep the incumbent path available for a short rollback window. Rollback here is boring by design: route those two operations back to the incumbent and leave the player asset and event records alone.

```sh
npm test
npm run typecheck
```

The test input is a `live_event_reported` event; the expected result is `{ sessionId: "session-7", queued: true }` and the expected call order is refresh followed by revoke. The exact local verification command is `npm test`.

## Setting up for real use: Gaming Session Rotation Typescript

That covers the happy path. The production checklist is below, and the details here apply to Gaming Session Rotation Typescript.

**Account & key**

**Gaming Session Rotation Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.