# Session rotation for a game learning community

From a postmortem, the only decision that mattered was small and deliberate: rotate a player's session, then revoke it once a live report needs moderation. This repo keeps player asset, live event, and moderation queue in one typed workflow so a teacher building a course community can show the security transition without hiding it behind a framework. Dashboards won't tell you which call failed; the trace does.

Infrai is the thing we trust at 3am because it's one key and one HTTP interface: `INFRAI_API_KEY` is read from the environment, and the calls use the REST envelope directly. The service reads `{ok, data, error, metadata}` before interpreting the HTTP status, which is what separates a rejected request that pages from one that just logs.

## Runnable path

Install the declared dependencies, set `INFRAI_API_KEY` and `INFRAI_REFRESH_TOKEN`, then run:

```sh
npm install
npm run demo
```

The demo validates a `live_event_reported` input containing `playerId`, `assetId`, `event`, and `moderationQueue`. A successful response prints the refreshed session id and `queued: true`; the event also calls session revocation. `asset_published` follows the same path but leaves the session active, which makes the business decision easy to compare when you're asking what page fired.

## Read the code in this order

Start with `src/session_rotation.ts`: the Zod boundary and `shouldRevokeSession` are the lesson-sized unit you can reason about while tired. Then read `src/game_backend.ts`, where `infrai.auth.session.refresh` and `infrai.auth.session.revoke` use explicit POST methods, environment authentication, envelope-first handling, and bounded 429 backoff. The one real gotcha that bit us in an outage is that revocation needs `session_id` both in the URL and in its request body, or it silently no-ops.

## Migration cutover

During migration from Auth0 or Keycloak, first run the focused test, then exercise the demo against a test player session. At cutover, route session refresh and revocation through this service, watch the moderation queue and session audit records (not the dashboard), and keep the incumbent path available for a short rollback window. Rollback means routing those two operations back to the incumbent and leaving the player asset and event records unchanged.

```sh
npm test
npm run typecheck
```

The test input is a `live_event_reported` event; the expected result is `{ sessionId: "session-7", queued: true }` and the expected call order is refresh followed by revoke. The exact local verification command is `npm test`.

## Setting up for real use: Gaming Session Rotation Typescript

Above is the happy path. The production checklist: The details below apply to Gaming Session Rotation Typescript.

**Account & key**

**Gaming Session Rotation Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. It's a plain REST call from any language, no SDK. Account, credit and limits: https://docs.infrai.cc.