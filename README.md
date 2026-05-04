# AIMOS 360º Review

Manifest's 360° appraisal dashboard. Line managers upload HiBob exports and get
AI-generated synthesis, FAST objectives, and L&D recommendations. Powered by
Claude Sonnet 4.6.

## Stack

- Vite + React (static SPA)
- Netlify Functions (Node 20, ESM, v2 handlers) for the AI proxy and admin API
- Google Sign-In (workspace-restricted to `manifest.group`) for auth
- Netlify Blobs for the user allowlist
- `@anthropic-ai/sdk` for Claude calls

## What you need

- A Google Workspace account on `manifest.group` (for sign-in)
- A GitHub account
- A Netlify account
- An Anthropic API key
- A Google Cloud OAuth Client ID (one-time setup, ~5 min)

---

## Step 1 — Google OAuth Client ID (one-time)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project named **AIMOS 360**
3. **APIs & Services → OAuth consent screen** — set User Type to "Internal"
   (Manifest workspace only) and fill in the basic app details
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `AIMOS 360 Web`
   - Authorised JavaScript origins:
     - `http://localhost:8888` (for local `netlify dev`)
     - `https://<your-netlify-subdomain>.netlify.app` (or your custom domain)
   - Authorised redirect URIs: leave empty (Google Identity Services uses the
     popup flow, no redirect URI needed)
5. Copy the **Client ID**. You'll paste this into Netlify env vars in Step 4.

---

## Step 2 — Anthropic API key

1. [console.anthropic.com](https://console.anthropic.com) → sign in with your
   Manifest email
2. Add a payment method
3. **API Keys → Create Key**, copy and save it

---

## Step 3 — GitHub

1. Push this folder to a new private GitHub repo named `aimos-360`
2. From this folder:

   ```bash
   git init
   git add .
   git commit -m "Initial scaffold"
   git branch -M main
   git remote add origin git@github.com:<your-org>/aimos-360.git
   git push -u origin main
   ```

---

## Step 4 — Netlify

1. [netlify.com](https://netlify.com) → **Add new site → Import an existing project**
2. Pick your `aimos-360` GitHub repo
3. Settings auto-detect from `netlify.toml` — no changes needed
4. **Site configuration → Environment variables** → add:

   | Key                 | Value                                                |
   | ------------------- | ---------------------------------------------------- |
   | `ANTHROPIC_API_KEY` | your Anthropic key from Step 2                       |
   | `GOOGLE_CLIENT_ID`  | your Google OAuth Client ID from Step 1              |
   | `ADMIN_EMAILS`      | `alex@manifest.group,kellie@manifest.group`          |

5. **Deploys → Trigger deploy → Deploy site** to pick up the new env vars
6. Note the Netlify URL (e.g. `https://aimos-360.netlify.app`) and add it to
   the **Authorised JavaScript origins** list back in Google Cloud Console (Step 1)

---

## Step 5 — Site URL (optional)

- **Site configuration → Site name** → e.g. `aimos-360` →
  `https://aimos-360.netlify.app`
- Or attach a custom domain (e.g. `360.manifest.group`) under
  **Domain management**, and add it to Google's authorised origins

---

## Done

Share the URL with line managers. They:

1. Click **Sign in with Google**
2. Pick their `@manifest.group` account
3. If they're not on the allowlist, they'll see a notice asking an admin to add
   them. Admins (you and Kellie) can add them at `<site>/#admin`

---

## Local development

```bash
npm install

# Set the env vars locally:
cat > .env <<'EOF'
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=xxxxxxx.apps.googleusercontent.com
ADMIN_EMAILS=alex@manifest.group,kellie@manifest.group
EOF

npm run dev
# → http://localhost:8888
```

`netlify dev` runs Vite + the Functions stack together with the same
`/api/*` redirects production uses.

---

## Updating the app

Edit, commit, push. Netlify rebuilds automatically.

Common updates:

- **Swap Claude model** — `netlify/functions/generate.js`, `MODEL` constant
- **Edit prompts** — `netlify/functions/lib/prompts.js`
- **Allowlist UI** — `src/components/Admin.jsx`
- **Add a new admin** — update `ADMIN_EMAILS` env var in Netlify (admins are
  intentionally not editable from the UI to avoid lockout)

---

## Architecture

```
Frontend (Vite + React, static, served from Netlify CDN)
  ├─ SignIn          Google Identity Services button
  ├─ Upload          xlsx/csv parsed in-browser via SheetJS
  ├─ Synthesis       calls /api/generate with type=synthesis
  ├─ Objectives                            type=objectives
  ├─ Development                           type=development
  └─ Admin           CRUD over /api/allowlist (admin-only)
        │
        │  Bearer <Google ID token>
        ▼
Netlify Functions (Node 20)
  ├─ /api/me          verifyToken → { email, isAdmin, isAllowed }
  ├─ /api/generate    verifyToken → allowlist check → Anthropic SDK call
  └─ /api/allowlist   verifyToken → admin check → Netlify Blobs read/write
        │
        ▼
Anthropic API (Claude Sonnet 4.6)
Netlify Blobs (allowlist storage)
```

Every function call verifies the Google ID token against Google's JWKS,
enforces the `manifest.group` workspace, and (for `/api/generate`) checks the
user is on the allowlist before spending an Anthropic token. There is no
client-side allowlist, no shared password, and no API key in the browser.

---

## Costs

- **Netlify**: free tier covers this comfortably
- **Anthropic API**: ~£0.05–0.10 per appraisal (3 Sonnet calls each)
- **Google OAuth**: free
- **Estimated annual cost**: under £15 for ~150 appraisals across all studios

---

## Troubleshooting

**"Google Identity Services failed to load"** — the `gsi/client` script is
blocked. Check the browser console; usually a corporate ad/tracker blocker.

**"GOOGLE_CLIENT_ID env var not configured"** on `/api/me` — the Netlify
build didn't pick up the env var. Re-trigger a deploy after setting it.

**"Account is not on the manifest.group workspace"** — the user signed in
with a personal Gmail. They need to use their `@manifest.group` Google account.

**"Not on allowlist"** on generate — admin needs to add the user at
`<site>/#admin`.

**"AI error: ..."** — check Anthropic console for billing/rate-limit issues,
and the Netlify function logs (Functions → generate → Logs) for the exact
error.

**Allowlist seems empty after first deploy** — the seeded list (10 emails
from the original artifact) is written on first read. Visit `/api/me` once as
an admin to trigger it, then reload `/#admin`.
