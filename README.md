# RevTrack

Mobile-first PWA for tracking car and bike maintenance, spending, fuel, papers and reminders. Next.js 15, Supabase (Auth, Postgres with RLS, private Storage), Tailwind v4, GSAP, Framer Motion.

## Deploy without running anything locally

1. **Supabase SQL Editor**: run these files in order (each once)
   `supabase/migrations/0001_init.sql`, `0002_profiles.sql`, `0003_odometer.sql`, `0004_garage_suite.sql`
   (skip any you already ran).
2. **GitHub**: unzip, then drag the contents of the `revtrack` folder into the repo (Add file > Upload files) and commit to `main`. Existing files are overwritten.
3. **Vercel environment variables** (Project Settings > Environment Variables), then redeploy:

| Name | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page, `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | same page, `service_role` key. Server only, never share it |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | push keys; subject like `mailto:you@example.com` |
| `CRON_SECRET` | any long random string |
| `GEMINI_API_KEY` | free key from https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | optional, default `gemini-2.5-flash` |

4. **Supabase > Authentication > URL Configuration**: Site URL = your Vercel URL, and add `https://your-app.vercel.app/**` to Redirect URLs.
5. **Phone**: open the site in Chrome, menu > Install app, then Alerts tab > Turn on notifications.

## Where things are
```
public/                 manifest, service worker (cache + push), offline page, icons
supabase/migrations/    SQL: tables, RLS on every table, private storage bucket
vercel.json             daily reminder cron (04:00 UTC, 09:00 Karachi)
src/middleware.ts       session refresh and route gate
src/app/(app)/          dashboard, ledger, garage, notifications, ustad, forms, settings
src/app/excise/         Excise Safe Mode (offline-capable shell)
src/app/api/            documents image, excise snapshot, push, cron, ustad
src/components/         Dashboard, FinancialLedger, Gauge, nav, forms, SosShare, ExciseView
src/lib/                predictions, ledger maths, alerts, push, AI, offline store
```
