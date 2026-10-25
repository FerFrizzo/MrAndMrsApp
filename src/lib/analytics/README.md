# Product analytics

PostHog on the EU cloud (`https://eu.i.posthog.com`). Session replay is off. GeoIP is off (`disableGeoip`). Events are enums, booleans, buckets, and React Navigation screen names — never names, emails, question text, answers, media URLs, access codes, or ids.

Analytics is disabled in Jest, in Expo Go, and in `__DEV__` unless `EXPO_PUBLIC_POSTHOG_ENABLE_DEV=1`. Every public call is a no-op until init finishes, when the key is missing, when the user has opted out, and when the SDK throws.

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
