# RevTrack

**RevTrack** is a mobile-first progressive web app for Gen Z drivers in Pakistan (and beyond) to manage cars and bikes: maintenance, fuel, spending, documents, and reminders—in one place with a fast, animated UI.

## Features

- **Dashboard** — Odometer, oil/brake/suspension gauges, spend stats, service predictions, tasks, and recent activity per vehicle.
- **Garage** — Separate **cars** and **bikes**, quick vehicle switcher, document wallet, and links into each vehicle’s detail page.
- **Ledger** — Maintenance logs, fuel entries, and category breakdown (maintenance, tuning, parts, fuel).
- **Alerts** — Due/overdue services, documents, tasks; optional **web push** reminders.
- **Excise Safe Mode** — Offline-friendly view of licence, registration, and token tax info when you need papers on the road.
- **AI Ustad** — Roman-Urdu friendly chat (Google Gemini) for common vehicle problems.
- **SOS share** — Generate a shareable image with vehicle and emergency contact details.
- **PWA** — Install to home screen, service worker caching, offline fallback page.

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, React 19) |
| Backend | [Supabase](https://supabase.com/) — Auth, Postgres + RLS, Storage |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Motion | [GSAP](https://gsap.com/) + [@gsap/react](https://gsap.com/docs/v3/Plugins/React/), Framer Motion (layout) |
| Deploy | [Vercel](https://vercel.com/) (cron for daily reminders) |

## Getting started

**Requirements:** Node.js **22+** recommended (Supabase client targets Node 22; Node 20 may still work with warnings).

```bash
git clone https://github.com/<your-org>/RevTrack.git
cd RevTrack
npm install
```

Copy environment variables (see below) into `.env.local`, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase `anon` key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key — **server only**, never expose to the client |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key |
| `VAPID_SUBJECT` | e.g. `mailto:you@example.com` |
| `CRON_SECRET` | Secret for `/api/cron/reminders` |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) key for AI Ustad |
| `GEMINI_MODEL` | Optional; default chain `3.1-flash-lite` → `3.5-flash-lite` → `3.5-flash` |

### Database

Run migrations in order in the **Supabase SQL Editor** (once per project):

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_profiles.sql`
3. `supabase/migrations/0003_odometer.sql`
4. `supabase/migrations/0004_garage_suite.sql`

In **Authentication → URL Configuration**, set **Site URL** to your app URL and add redirect URLs (e.g. `https://your-app.vercel.app/**` and `http://localhost:3000/**` for local auth).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server locally |

## Project layout

```
public/                 PWA manifest, service worker, offline page, icons
supabase/migrations/    Schema, RLS, storage policies
vercel.json             Cron: daily reminders (04:00 UTC)
src/app/(app)/          Authenticated app: dashboard, ledger, garage, alerts, settings, forms
src/app/(auth)/         Login and signup
src/app/excise/         Excise Safe Mode (works offline)
src/app/api/            Documents, excise snapshot, push, cron, AI Ustad
src/components/         UI, dashboard, nav, forms, gauges, ledger
src/lib/                Predictions, ledger, alerts, push, AI, auth helpers
src/middleware.ts       Session refresh and protected routes
```

## Deploy on Vercel

1. Import the GitHub repo into Vercel.
2. Add all environment variables from the table above.
3. Deploy; confirm the cron in `vercel.json` is enabled on your plan.
4. On a phone: open the site in Chrome → **Install app**; in **Alerts**, enable push notifications.

## License

Private / all rights reserved unless you add an open-source license file.
