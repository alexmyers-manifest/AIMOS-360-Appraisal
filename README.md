# AIMOS 360º Review

Manifest's 360° appraisal dashboard. A line manager uploads a HiBob 360°
export, and AIMOS produces an editable overview, FAST objectives, an L&D plan,
and a printable PDF — restricted to `@manifest.group` accounts on a manually
curated allowlist.

Live: https://aimos-review.netlify.app

---

## How a line manager uses it

1. Sign in with their Manifest Google account.
2. Drop the HiBob `.xlsx` (or `.csv`) consolidated export onto the upload
   zone. Optionally drop the appraisee's previous 360° export onto the second
   slot to enable comparison.
3. AIMOS chains three Sonnet 4.6 calls (synthesis → objectives → development),
   ~10–20 s end to end.
4. The LM reviews and **edits** the overview statement, objectives, and L&D
   plan in **LM view** (default). The 360° feedback summary itself stays
   read-only — it's AIMOS' read of the data, not the LM's commentary.
5. **Switch to Normal view** (top right) to hide raw scores and reviewer
   attribution — that's the appraisee-shareable cut.
6. **Print / PDF** downloads a self-contained HTML file styled for A4. Open
   it and Cmd/Ctrl+P → Save as PDF. The active view (LM or Normal) determines
   what's in the printed output, so for an appraisee-friendly PDF: switch to
   Normal first, then Print.
7. The last 20 appraisals run from the same browser appear in the upload
   screen's history list — click to rehydrate.

---

## Features

- **Google Sign-In** — workspace-restricted to `manifest.group`, server-side
  ID-token verification on every API call (no shared password, no API key in
  the browser, no client-side allowlist).
- **Admin allowlist** — managed at `/#admin` by emails listed in the
  `ADMIN_EMAILS` env var (currently Alex + Kellie). Backed by Netlify Blobs.
- **Three AI generators** chained sequentially: 360 feedback synthesis,
  4-pillar FAST objectives (Performance / Product / People / Purpose), L&D
  plan with reading recommendations.
- **LM view ↔ Normal view** — LM sees raw scores, gap table, reviewer-
  attributed comments, and edit affordances; Normal hides scores and locks
  edits.
- **Editable everywhere except the synthesis** — Overview Statement, all
  Objectives fields, all Development fields. Click any underlined block to
  edit. Saves to localStorage on blur.
- **Editable display name** in LM view — for "Oliver" who actually goes by
  "Oli". Doesn't change the underlying parsed data.
- **Score colour rule** — Peer avg / Self / Manager / Overall stats are blue
  by default; if one is >2 points above the average of the other three it
  turns Manifest green, >2 below turns Manifest orange.
- **Comparison tab** — appears when a previous 360° export is uploaded.
  Side-by-side deltas across headline ratings, competency peer averages, and
  value peer averages. The Overview's radar adds a dashed grey "Previous"
  series, and the title-module stats show ▲/▼ deltas next to each value.
- **Per-user appraisal history** — last 20 appraisals per signed-in user,
  stored in localStorage (keyed by email hash). Click an entry to rehydrate.
- **Wordcloud** at the bottom of the 360 Feedback tab — top 40 words from
  the open feedback, sized by frequency, coloured Manifest green (positive) /
  orange (critical) / grey (neutral) via an embedded English lexicon.
  Excludes the appraisee's name. Swedish output renders all-grey
  (no Swedish lexicon shipped).
- **Languages**: 🇬🇧 UK English · 🇺🇸 US English · 🇦🇺 AU English ·
  🇸🇪 Svenska. UI strings + AI prompt language both switch. AU routes to UK
  spelling rules with permission for natural Australian phrasing.
- **Print / PDF** — Print button downloads a self-contained HTML report with
  inline SVG charts, A4 page rules, and `break-inside: avoid` on every card
  and objective.
- **Resilient AI calls** — 3-attempt retry with exponential backoff and a
  sequence-number guard so a stale in-flight response can't overwrite fresh
  state if you upload a different file mid-generation.

---

## Architecture

```
Frontend (Vite + React, static, served from Netlify CDN)
  ├─ SignIn               Google Identity Services button (popup mode)
  ├─ Upload               .xlsx/.csv parsed in-browser via SheetJS;
  │                       previous-appraisal slot + history list
  ├─ TitleModule          name + role + meta + 4-stat headline
  ├─ Tabs:
  │   ├─ Overview         editable statement → radar → score breakdown
  │   ├─ Values           bar chart + per-value drilldowns (LM only)
  │   ├─ 360 Feedback     locked synthesis + wordcloud
  │   ├─ Objectives       2-across grid, editable
  │   ├─ Development      coaching focus + opportunities + reading
  │   ├─ Compare          (when prevData) deltas + previous radar series
  │   └─ Appraisal info   feedback counts + timestamps + reviewer
  └─ Admin (/#admin)      CRUD over /api/allowlist (admin-only)
        │
        │  Authorization: Bearer <Google ID token>
        ▼
Netlify Functions (Node 20, ESM, v2 handlers)
  ├─ /api/me              verifyToken → { email, isAdmin, isAllowed }
  ├─ /api/generate        verifyToken → allowlist check → Anthropic call
  │                       (3-attempt retry on the client side)
  └─ /api/allowlist       verifyToken → admin check → Netlify Blobs r/w
        │
        ▼
Anthropic API (Claude Sonnet 4.6, prompt caching on system prompt)
Netlify Blobs (single allowlist store)
localStorage (per-user session + last-20 history, on the device)
```

**Auth flow**: every function call verifies the Google ID token against
Google's JWKS, enforces `hd === "manifest.group"`, and (for `/api/generate`)
checks the email is on the allowlist before spending an Anthropic token.

---

## Tech stack

- **Frontend**: Vite + React 18, Recharts (radar + bar charts), SheetJS
  (xlsx parsing), PP Neue Montreal (web fonts in `/public/fonts/`)
- **Functions**: Node 20, `@anthropic-ai/sdk`, `jose` (JWT verify), `@netlify/blobs`
- **Auth**: Google Identity Services (popup) → ID token → JWKS verify
- **Hosting**: Netlify (Pro)

---

## What you need (one-time setup)

- A `@manifest.group` Google Workspace account
- A GitHub account with access to push to the repo
- A Netlify account (Pro recommended for the function timing/quota headroom)
- An Anthropic API key
- A Google Cloud OAuth Client ID (set up below)

### Step 1 — Google OAuth Client ID

1. https://console.cloud.google.com → create a project named **AIMOS 360**.
2. **APIs & Services → OAuth consent screen** → User type **Internal**, fill
   the basics. Authorised domain: `manifest.group`.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** →
   Application type **Web application**.
4. **Authorised JavaScript origins**:
   - `http://localhost:8888` (local dev)
   - `https://aimos-review.netlify.app` (or your custom domain)
5. **Authorised redirect URIs**: leave empty (popup flow doesn't use them).
6. Copy the **Client ID** for Step 4.

### Step 2 — Anthropic API key

[console.anthropic.com](https://console.anthropic.com) → sign in → add a
payment method → **API Keys → Create Key**. Name it `aimos-360`.

### Step 3 — GitHub

The repo lives at https://github.com/alexmyers-manifest/AIMOS-360-Appraisal.
For a fresh deployment, fork or clone it.

### Step 4 — Netlify

1. **Add new site → Import an existing project** → pick the repo.
2. Settings auto-detect from `netlify.toml`. Don't override.
3. **Site configuration → Environment variables** — add:

   | Key                 | Value                                              |
   | ------------------- | -------------------------------------------------- |
   | `ANTHROPIC_API_KEY` | your Anthropic key                                 |
   | `GOOGLE_CLIENT_ID`  | your Google OAuth Client ID                        |
   | `ADMIN_EMAILS`      | `alex@manifest.group,kellie@manifest.group`        |

4. **Deploys → Trigger deploy → Deploy site** to pick up the env vars.
5. Note the Netlify URL and add it to Google's authorised JS origins
   (Step 1.4).

---

## Local development

The app needs Node 20 (or later) installed. To install via Homebrew:
`brew install node@20`.

```bash
npm install

# Local env (matches what you put in Netlify, plus optionally GOOGLE_CLIENT_ID
# also exposed for the Vite build):
cat > .env <<'EOF'
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=xxxxxxx.apps.googleusercontent.com
ADMIN_EMAILS=alex@manifest.group,kellie@manifest.group
EOF

npm run dev
# → http://localhost:8888 (netlify dev: Vite + functions stack)
```

`npm run dev` runs `netlify dev` — that proxies the Vite frontend AND serves
the functions, with the same `/api/*` rewrites production uses. If you only
need the frontend (no AI calls), `npm run dev:vite` is faster but `/api/*`
will 404.

---

## Common updates

| Change | File |
|---|---|
| Swap Claude model | `netlify/functions/generate.js` → `MODEL` constant |
| Edit AI prompts | `netlify/functions/lib/prompts.js` (verbatim from the artifact) |
| Add/remove admin | Update `ADMIN_EMAILS` env var on Netlify, redeploy. Admins are intentionally **not** editable from the UI to avoid lockout. |
| Add/remove allowlisted user | The admin UI at `/#admin`, no redeploy needed |
| Edit Manifest value definitions | `src/lib/parseHibob.js` → `VALUES_DEFS` |
| Edit competency definitions | `src/lib/parseHibob.js` → `COMPETENCIES` |
| Add a new language | `src/lib/i18n.js` (`STRINGS` + `LANGUAGES` + `aiLanguageDirective`), and same `aiLanguageDirective` in `netlify/functions/lib/prompts.js` |
| Tweak score-colour threshold | `src/components/TitleModule.jsx` → `scoreAccent` |
| Tweak wordcloud sentiment lists | `src/lib/wordcloud.js` → `POSITIVE` / `NEGATIVE` |
| Brand colours / typography | `src/styles.css` (CSS variables at the top) |

Edit, commit, push — Netlify auto-rebuilds. ~90 seconds.

---

## Costs

- **Netlify**: free tier handles this; Pro recommended for the higher
  function timeout headroom (26s vs 10s) and bandwidth.
- **Anthropic API**: ~£0.05–0.10 per appraisal (3 Sonnet calls each, with
  prompt caching on the shared system prompt).
- **Google OAuth**: free.
- **Annual cost** at ~150 appraisals across all studios: under £15.

---

## Troubleshooting

**"Google Identity Services failed to load"** — the `gsi/client` script is
blocked. Usually a corporate ad/tracker blocker. Check the browser console.

**"GOOGLE_CLIENT_ID env var not configured"** on `/api/me` — the Netlify
build didn't pick up the env var. Trigger a fresh deploy.

**"Account is not on the manifest.group workspace"** — the user signed in
with a personal Gmail or another workspace. They need to use their
`@manifest.group` Google account.

**"Not on allowlist"** on generate — an admin needs to add the user at
`<site>/#admin`.

**"AI error: …"** in the Synthesis / Objectives / Development tab —
the function returned a 500. Check Netlify function logs (**Functions →
generate → Logs**) for the exact error. Common causes: Anthropic billing
issue, rate limit, transient overload (529). The 3-attempt retry handles
most transients automatically; persistent failures need investigation.

**"Generation failed — retried 3 times"** — Anthropic was unavailable for
the whole retry window. Try again later, or check the Anthropic status page.

**Allowlist seems empty after first deploy** — the seed list (10 emails)
is written to Netlify Blobs on the *first read*. Visit `/api/me` once as an
admin (or load the app) to trigger seeding, then reload `/#admin`.

**Print PDF looks weird** — open the downloaded `.html` directly in your
browser, then Cmd/Ctrl+P. Settings: Save as PDF, Layout Portrait, Margins
Default, **Background graphics ON** (so the colour pills render).

**Switching to Swedish makes the wordcloud all grey** — that's expected.
The sentiment lexicon is English-only. To add Swedish: extend the
`POSITIVE` / `NEGATIVE` sets in `src/lib/wordcloud.js`.

---

## Licensing & credits

- **PP Neue Montreal** font — bundled in `/public/fonts/` for use under
  Manifest's existing Pangram Pangram licence. Verify the licence covers
  internal web deployment before any external sharing. Fallback chain in
  CSS uses Neue Haas Grotesk → Helvetica Neue → system if the font
  doesn't load.
- **Manifest brand assets** (roundel SVG, palette) — internal Manifest
  brand, used per the brand guidelines.
- **Source artifact** — original 1,473-line single-file Claude artifact by
  Alex; rebuilt as this Vite + Netlify app.

---

## Things that aren't built (and where to start if you want them)

- **Cross-device history sync.** Currently localStorage = per-browser. To
  sync, swap the implementation in `src/lib/storage.js` from
  `localStorage` to a Netlify Blobs store keyed by email hash. The component
  surface stays the same.
- **Background-function generation.** If `/api/generate` ever times out
  consistently, switch it to a Netlify background function with
  client-side polling (the INCITE InBox project uses this pattern).
- **Confirmation guard on "Upload different file".** Currently wipes
  edits with no warning.
- **Swedish sentiment lexicon for the wordcloud.** Replace the English-only
  POSITIVE/NEGATIVE sets with locale-aware ones.

None of these are blocking. They're noted here so the next person knows
where to start.
