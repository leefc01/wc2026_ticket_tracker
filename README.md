# FIFA World Cup 2026 — Ticket Intelligence

AI-powered price tracker and purchase advisor for World Cup 2026 tickets. Built as a prototype demonstrating a multi-layer AI application architecture using the Anthropic Claude API.

---

## What it does

- Tracks simulated resale price history across 18 matches (Group Stage through Final) at all 16 host stadiums
- Displays official face value vs. resale market price across four seat categories (Cat 1–4)
- Configurable price alerts that fire browser OS notifications when conditions are met
- Forward-looking scenario simulation with three projected price paths to match day
- AI Purchase Analyst powered by Claude — RAG retrieval + signal-weighted analysis
- All five AI buttons display results directly in the app — no clipboard, no tab switching
- Signal context card shown before every AI result — which signals were applied and at what weight
- Portfolio/watchlist with cross-match spend totals and AI buy-priority ranking
- User-configurable signal weights including Buyer Intent toggle (Attend vs. Speculative)

---

## Architecture

```
Layer 1 — Data (seeded → production: Playwright scraper)
  generatePrices() + buildMatches()
  → swap with fetch('/api/matches') to connect a live scraper

Layer 2 — Application (browser, stateful JS)
  Filters · Category selector · Chart · Alert engine
  Watchlist · Portfolio · Scenario simulation · Notifications

Layer 3 — AI (two sub-layers)
  3a: Embedded inference — callClaude() routes to:
      · Vercel: POST /api/analyze (key server-side, never in browser)
      · Local:  direct Anthropic API call (key from input field)
      Analyze: two sequential calls — RAG retrieval → grounded analysis
      All other AI buttons: single call, results displayed in AI panel
  3b: Conversational handoff — sendPrompt() when running in claude.ai

Layer 4 — Simulation
  Forward price projection: base / best / worst case scenarios
  Configurable: trajectory, team event, supply shock, confidence band
```

---

## Signal weights

Users configure eight signals that inject into each AI analysis. Signals are context-aware — each analysis type only receives the subset relevant to its reasoning task. A signal context card is rendered before every AI result showing exactly which signals were applied.

| Signal | Analyze | Simulation | Best Value | Resale Risk |
|---|---|---|---|---|
| Price trend | ✓ | ✓ | | ✓ |
| Days remaining | ✓ | ✓ | | |
| Bracket position risk | ✓ | ✓ | ✓ | ✓ |
| Fan travel accessibility | ✓ | | ✓ | ✓ |
| Rivalry / atmosphere | ✓ | | ✓ | |
| Resale liquidity | ✓ | | | ✓ |
| Budget flexibility | ✓ | | ✓ | |
| Buyer intent (Attend / Speculative) | ✓ | ✓ | ✓ | ✓ |

---

## Running locally

1. Download `index.html` (rename from `wc2026_ticket_tracker_v11.html`)
2. Open in any modern browser
3. Paste your Anthropic API key (`sk-ant-...`) into the key field at the top
4. All features work — AI buttons call the Anthropic API directly from the browser

No build step, no dependencies, no server required for local use.

---

## Deploying to Vercel

### File structure

```
your-project/
  index.html          ← rename the v11 HTML file to this
  api/
    analyze.js        ← Vercel serverless proxy (unchanged since v8)
  README.md
```

### Steps

1. Create a free account at [vercel.com](https://vercel.com)
2. Add your Anthropic API key as an environment variable:
   - Project → Settings → Environment Variables
   - Name: `ANTHROPIC_API_KEY` · Value: `sk-ant-...`
3. Deploy via drag-and-drop (drag the project folder onto vercel.com/new)
   - Framework preset: **Other** (no build step)
   - Build command: leave blank
   - Output directory: leave blank

### How the proxy works

On Vercel, `callClaude()` auto-routes to `POST /api/analyze` instead of calling the Anthropic API directly. The serverless function injects `ANTHROPIC_API_KEY` server-side — it never reaches the browser. The API key input field in the UI is only needed for local use.

---

## Production upgrade path

| Component | Current | Production |
|---|---|---|
| Match data | `buildMatches()` seed function | `fetch('/api/matches')` from Playwright scraper |
| Price history | `generatePrices()` synthetic curves | Scraped from StubHub, SeatGeek, FIFA resale |
| API key | Browser input / Vercel env var | Vercel env var only (remove input field) |
| Alert delivery | Browser notifications only | + Twilio SMS / SendGrid email |
| RAG retrieval | Claude's training knowledge | Vector DB (Pinecone/Supabase) over live news corpus |

---

## Seat categories

| Category | Multiplier | Description |
|---|---|---|
| All (default) | — | Shows price range Cat 4–Cat 1; sort/filter anchors to Cat 3 |
| Cat 1 | 2.2× base | Best seats, center pitch |
| Cat 2 | 1.5× base | Premium |
| Cat 3 | 1.0× base | Standard (sort/filter/alert anchor) |
| Cat 4 | 0.65× base | Restricted view |

---

## Changelog

**v11**
- Star button (★) renders amber (#F5A623) when active — visible in dark and light mode
- All five secondary AI buttons (Best Value, Resale Risk, Scenario Risk, Analyze Portfolio, Risk Breakdown) now route through `callClaude()` and display results directly in the AI panel
- Signal context card rendered before every AI result — color-coded chips show which signals were applied (blue = High priority, green = Buyer intent)
- `setAiBtnsDisabled()` disables all AI buttons during active calls to prevent concurrent requests
- Graceful try/catch around chart renders — CDN failure no longer halts app execution
- Accessibility: `aria-label` on all filter selects and star buttons; proper `for`/`id` label associations on form fields
- Favicon 404 suppressed with inline data URI `<link rel="icon" href="data:,">`

**v10**
- New 8-signal set (replaced v9's 5 signals)
- `SIGNAL_CONTEXTS` lookup table and `buildSignalContext()` for context-aware injection
- Buyer Intent binary toggle (Attend / Speculative) — reframes all four analysis types
- Two-row signal grid layout

**v9** — Category button ID fix, immediate alert analysis, `callClaude()` error handling, portfolio category awareness, `avg90` removed

**v8** — All category (default), four-line chart, section reorder, Vercel proxy routing

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Complete single-file application |
| `api/analyze.js` | Vercel serverless proxy (unchanged since v8) |
| `README.md` | This file |

---

## Built with

- [Anthropic Claude API](https://docs.anthropic.com) — claude-sonnet-4-20250514
- [Chart.js 4.4.1](https://www.chartjs.org) — price history and simulation charts
- Vanilla HTML/CSS/JS — no framework dependencies
- [Vercel](https://vercel.com) — recommended hosting

---

*Prices are simulated. This is a prototype demonstrating AI application architecture — not financial or purchasing advice.*
