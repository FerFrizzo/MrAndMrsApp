# Product analytics

PostHog on the EU cloud (`https://eu.i.posthog.com`). Session replay is off. GeoIP is off (`disableGeoip`). Events are enums, booleans, buckets, and React Navigation screen names — never names, emails, question text, answers, media URLs, access codes, or ids.

Analytics is disabled in Jest, in Expo Go, and in `__DEV__` unless `EXPO_PUBLIC_POSTHOG_ENABLE_DEV=1`. Every public call is a no-op until init finishes, when the key is missing, when the user has opted out, and when the SDK throws.

## Events

The catalogue is `events.ts`; `track()` only accepts what it declares. Besides the journey steps, two groups exist so a drop-off can be explained, not just seen:

- **Failures**: `sign_in_failed` and `password_reset_failed` (classified `reason`, never the provider message), `invite_failed`, `answers_submit_failed`, `purchase_failed` (classified store `reason`). Cancellations are `purchase_cancelled`, not failures.
- **Money path**: `purchase_completed` fires when the store charges; `premium_granted` / `premium_grant_failed` fire when the app writes `is_paid` on the game. A `purchase_completed` without a `premium_granted` is a user who paid and did not get premium (dashboard insight 8).

## Keys

Copy the repo `.env.example` to `.env` for local Expo. `EXPO_PUBLIC_POSTHOG_KEY` is the public project key (it is bundled into the app). Do not put a PostHog personal API key in any `EXPO_PUBLIC_*` variable, and do not commit a filled-in `.env`.

## EAS

EAS Build does not read a developer machine `.env`. Set the variables on the project (expo.dev → Project → Environment variables), or:

```
eas env:create --name EXPO_PUBLIC_POSTHOG_KEY --value phc_... --visibility plaintext --environment production
eas env:create --name EXPO_PUBLIC_POSTHOG_HOST --value https://eu.i.posthog.com --visibility plaintext --environment production
```

Repeat for `preview` if those builds should report. Leave `EXPO_PUBLIC_POSTHOG_ENABLE_DEV` unset on production and preview.

`EXPO_PUBLIC_*` values are inlined into the client even if EAS marks them sensitive. Treat the project key as public. The personal key used by the dashboard script stays outside the app.

## Dashboard

Dry run (prints the planned insights, writes nothing):

```
node scripts/posthog-dashboard.mjs
```

Apply (personal API key with insight and dashboard write, EU project id):

```
POSTHOG_PERSONAL_API_KEY=phx_... POSTHOG_PROJECT_ID=12345 node scripts/posthog-dashboard.mjs --apply
```

`POSTHOG_API_HOST` defaults to `https://eu.posthog.com` (the management API, not the ingest host). The script reuses a dashboard named "Mr & Mrs funnel" and skips insights that already exist by name.

## Opt-out

Account → Share usage data. The choice is stored on device (`mrandmrs.analytics.optOut`). Turning it off sends `analytics_opted_out`, flushes, then calls the SDK opt-out. `reset()` on sign-out restores that choice because PostHog's reset clears its own flag.
