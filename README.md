# GradeScout

A free, open source, photo-based pre-grading estimator for trading cards. Upload a front and
back photo (plus an optional angled shot), and a vision-capable Claude model gives back a rough
PSA-style grade range, a confidence level, and a pillar-by-pillar breakdown (centering, corners,
edges, surface).

**GradeScout is not affiliated with, endorsed by, or connected to PSA, CGC, BGS, SGC, or any
official grading company.** It is an independent estimate from photos only — see
`src/components/Disclaimer.tsx` for the exact copy shown to users, and please don't remove it in
a fork.

## How it works

1. A visitor uploads 1-3 photos in the browser (`src/components/UploadForm.tsx`).
2. The photos are base64-encoded and posted to `/api/grade` (`src/app/api/grade/route.ts`).
3. The API route checks a daily rate limit (Upstash Redis, see below), then sends the photos to
   the Anthropic API with the grading prompt in `src/lib/gradePrompt.ts`.
4. The model's structured JSON response is rendered by `src/components/ResultCard.tsx`.

## Local development

```bash
npm install
cp .env.example .env.local
# edit .env.local and paste in your ANTHROPIC_API_KEY at minimum
npm run dev
```

Then open http://localhost:3000. Without `UPSTASH_REDIS_REST_URL` / `_TOKEN` set, rate limiting
is simply skipped (fine for local dev, **not** fine for a public deployment — see below).

## Deploying it for real (GitHub + Vercel)

You'll need free accounts on GitHub, Vercel, and the Anthropic Console (with billing enabled,
since this design has you covering every visitor's grading calls centrally).

**1. Push this code to a new GitHub repo:**

```bash
git add -A
git commit -m "Initial GradeScout commit"
git branch -M main
git remote add origin https://github.com/<your-username>/gradescout.git
git push -u origin main
```

(Create the empty repo at github.com/new first — don't initialize it with a README, or the push
above will conflict.)

**2. Import the repo into Vercel:**

- Go to vercel.com → Add New → Project → import your `gradescout` repo. Vercel auto-detects
  Next.js; no build settings need changing.
- Before the first deploy (or right after, then redeploy), add these under
  Project Settings → Environment Variables:
  - `ANTHROPIC_API_KEY` — from console.anthropic.com → API Keys.
  - `ANTHROPIC_MODEL` — optional, defaults to a current Claude model.
  - `MAX_GRADINGS_PER_DAY_GLOBAL` / `MAX_GRADINGS_PER_DAY_PER_VISITOR` — see cost section below.

**3. Add rate limiting (Upstash Redis via Vercel's integration):**

- In your Vercel project → Storage tab → Create Database → Upstash → Redis (free tier). Vercel
  provisions it and injects `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` automatically —
  no separate Upstash signup needed.
- Redeploy once those variables exist so the running app picks them up.

That's it — pushing to `main` from then on auto-deploys.

## Estimating your cost ceiling

Every grading call is one Claude API request with 1-3 images. Rough sizing:

- `MAX_GRADINGS_PER_DAY_GLOBAL` is your hard ceiling on total daily gradings site-wide, regardless
  of how many visitors show up. Multiply it by the per-request cost of your chosen model (see
  console.anthropic.com/settings/billing for current pricing) to get your absolute worst-case
  daily spend, and start conservative — you can raise it once you know real traffic.
- `MAX_GRADINGS_PER_DAY_PER_VISITOR` stops one visitor from single-handedly draining the global
  cap.
- Both are read fresh on every request (no redeploy needed) since they're plain env vars — change
  them in Vercel's dashboard and they take effect on the next request.

## Adding ads later

`src/components/AdSlot.tsx` reserves layout space for ads but doesn't ship any ad network wired
up — that needs your own account. Once you have one:

1. **Google AdSense** typically requires the site to be live with real content first, then apply
   at adsense.google.com. Approval can take days to weeks.
2. Once approved, add the AdSense loader script to `src/app/layout.tsx`'s `<head>`, and replace
   the placeholder `<div>` in `AdSlot.tsx` with your actual `<ins class="adsbygoogle">` snippet.

## Project structure

```
src/
  app/
    page.tsx              landing page
    layout.tsx             root layout, metadata
    api/grade/route.ts     grading API endpoint
  components/
    UploadForm.tsx         photo upload + submit flow (client component)
    ResultCard.tsx          renders the grade breakdown
    Disclaimer.tsx          required "not a real grade" banner
    AdSlot.tsx              ad placeholder
  lib/
    gradePrompt.ts          the grading system prompt / rules
    anthropic.ts            Anthropic client setup
    rateLimit.ts            Upstash-backed daily rate limiting
    types.ts                shared TypeScript types
```

## Changing the branding

"GradeScout" is just a working name — search-and-replace it in `package.json`,
`src/app/layout.tsx` (metadata), and `src/app/page.tsx` (heading/footer). The footer's GitHub
link in `page.tsx` is a placeholder — point it at your actual repo once it exists.

## License

MIT — see `LICENSE`. Free to use, fork, and modify.
