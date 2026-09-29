# RevTrack

Mobile-first PWA for tracking car and bike maintenance. Next.js 15 (App Router), Supabase (Auth + Postgres with RLS), Tailwind v4, GSAP.

## Deploy without running anything locally

### 1. GitHub
1. Create an empty repo on github.com (no README, no .gitignore).
2. Unzip this project on your computer.
3. On the repo page choose **uploading an existing file** and drag in **the contents** of the unzipped folder (`src`, `public`, `supabase`, `package.json`, `.gitignore`, and the rest). Do not drag the outer folder itself.
4. Commit to `main`.

### 2. Supabase
1. Create a project at supabase.com.
2. **SQL Editor**: paste all of `supabase/migrations/0001_init.sql` and run it.
3. **Project Settings > API**: copy the Project URL and the `anon` public key.
4. **Authentication > Providers > Email**: while testing, turn **Confirm email** off so signup logs you in immediately. Turn it back on once the site URL below is set.

### 3. Vercel
1. Import the GitHub repo (framework is detected as Next.js).
2. Add two environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy.

### 4. Tell Supabase your live URL
**Authentication > URL Configuration**
- Site URL: your Vercel URL, like `https://revtrack.vercel.app`
- Redirect URLs: add `https://revtrack.vercel.app/**`

Never put the `service_role` key anywhere in this project. The anon key is safe because Row Level Security restricts every row to its owner.

### 5. Install on your phone
Open the Vercel URL in Chrome on Android, then menu > **Install app**.

## Layout
```
public/            manifest, service worker, offline page, icons
supabase/          SQL migration (tables, RLS, complete_task function)
src/middleware.ts  session refresh and route gate
src/app/(auth)/    login, signup, auth server actions
src/app/(app)/     dashboard, vehicles/new, logs/new, tasks/new, settings
src/components/    DashboardClient (tabs, predictions, checklist, GSAP)
src/lib/           Supabase clients, prediction maths, form validation
```
