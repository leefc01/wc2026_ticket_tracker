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
- Signals Applied card always visible — updates on button hover, shows which signals are active
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

Layer 3 — AI (embedded inference)
  callClaude() routes to:
    · Vercel: POST /api/analyze (key server-side, never in browser)
    · Local:  direct Anthropic API call (key from input field)
  Analyze: two sequential calls — RAG retrieval → grounded analysis
  All other AI buttons: single call, results displayed in AI panel

Layer 4 — Simulation
  Forward price projection: base / best / worst case scenarios
  Configurable: trajectory, team event, supply shock, confidence band
```

---

## Signal weights

Users configure eight signals that inject into each AI analysis. Signals are context-aware — each analysis type only receives the subset relevant to its reasoning task. The Signals Applied card above the action buttons always shows which signals are active. Hovering any button updates the card. Signal Weights configuration is at the bottom of the page — accessible from both Tracker and Portfolio via the "adjust weights ↓" link.

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

1. Download `index.html` (rename from `wc2026_ticket_tracker_v16.html`)
2. Open in any modern browser
3. Paste your Anthropic API key (`sk-ant-...`) into the key field at the top
4. All features work — AI buttons call the Anthropic API directly from the browser

No build step, no dependencies, no server required for local use.

---

## Deploying to Vercel

### File structure

```
your-project/
  index.html          ← rename the v16 HTML file to this
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
| Price data (alerts) | Static seeded prices — `checkAlerts()` evaluates fixed values | Add `setInterval` random walk for live demo; real scraper for production |
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

**v16**
- Star button increased to `font-size:18px`, resting color raised to `var(--color-text-secondary)` — clearly visible in dark and light mode before interaction
- Match list price now reflects selected seat category — Cat 3 when All is selected (consistent with sort/filter anchor); panel label updates dynamically
- Price Alerts: added Category selector per alert — each alert evaluates against its own Cat 1–4; `condLabel()` and `evalAlert()` updated to use `a.cat`; alert list and notification tray show the category
- Portfolio AI panel now has three buttons matching Tracker: Analyze portfolio (all 8 signals), Best value (bestValue signals), Risk breakdown (resaleRisk signals)
- `analyzePortfolio()` switched to `analyze` signal context (all 8); updated prompt for buy/wait timing and spend assessment
- `askPortfolioBestValue()` added — ranks watchlisted matches by value using bestValue signals
- `PORT_BTN_IDS` updated to include all three portfolio buttons
- Signal Weights collapsible moved to bottom of page — "adjust weights ↓" link scrolls down to reach it from both Tracker and Portfolio views
- `formatText()` applied to `askResaleRisk()` and `askPortfolioRisk()` — both now render with paragraph breaks and bold markdown
- Code cleanup: CSS comment for `.sig-ctx-adj` updated to reflect ↓ direction; `adjust weights ↑` → `adjust weights ↓` throughout

**v15**
- Signal Weights collapsible moved above the nav tabs — now globally accessible from both Tracker and Portfolio views; single set of form inputs, no duplicate IDs
- Portfolio AI Summary gains Signals Applied card and button hover highlight, matching Tracker behavior — `setPortActiveBtn()` mirrors `setActiveBtn()` for portfolio context
- Portfolio defaults: Analyze portfolio → `bestValue` signals, Risk breakdown → `resaleRisk` signals; resets on view switch
- `formatText()` added — formats all AI result text with paragraph breaks (`\n\n` → `<p>`), line breaks (`\n` → `<br>`), and `**bold**` markdown; applied to all seven result rendering callsites
- `sigCardHTML()` extracted as shared inner renderer used by both `setActiveBtn()` and `setPortActiveBtn()`
- Code cleanup: removed leftover `let buyerIntent` variable (value was always read from hidden input via `getWeights()`); removed unused `btn` variable from `analyzeSimulation()`; removed `white-space:pre-line` from result div (superseded by `formatText()`)
- Production Upgrade Path: noted that `checkAlerts()` evaluates against static seeded prices; a `setInterval` random walk can be added for demo purposes to make alerts triggerable during a session

**v14**
- Signals Applied card (`#sig-applied`) is now a permanent fixture between the AI output and the action buttons — always visible, never hidden
- Removed "Signals if you click" preview card and all associated machinery (`renderPreviewCtx`, `showPreview`, `hidePreview`, `clearPreview`, `#ai-preview` slot, `.sig-ctx.preview` CSS)
- Button hover updates the Signals Applied card and highlights the hovered button via `setActiveAiBtn()` — highlight is sticky, staying on the last-hovered button until another is hovered or a match is selected
- `.ai-btn.active` replaces `.ai-btn.primary`; all button state is now JS-driven, consistent with category button pattern
- `renderSignalCtx()` removed — signal context is shown exclusively in the permanent panel, not embedded in result HTML
- Code cleanup: removed unused `faceVal()`, `IN_CLAUDE`, `let buyerIntent`, `vol` and `demandBoost` match properties

**v13**
- Signal preview card shown by default on load and on every match select
- `hidePreview()` returned to analyze default instead of hiding; `clearPreview()` added for AI handlers
- `showPreview('analyze')` called in `selectMatch()` to keep preview current with selected match

**v12**
- Signal preview on button hover — shows signals that will be applied before any API call
- Preview card uses dashed border to distinguish from post-result cards
- "adjust weights ↑" link opens Signal Weights panel and scrolls to it
- `buildChips()` extracted as shared helper; `openSignalWeights()` added
- Signal Weights collapsible gets `id="rc-coll"` for `scrollIntoView` target

**v11**
- Star button (★) renders amber (#F5A623) — visible in dark and light mode
- All five AI buttons route through `callClaude()`, results display in AI panel
- Signal context card before every AI result — color-coded chips (blue = High, green = Buyer intent)
- `setAiBtnsDisabled()` prevents concurrent API calls
- Graceful try/catch around chart renders — CDN failure no longer halts app
- Accessibility: `aria-label` on filter selects and star buttons; `for`/`id` label associations on form fields
- Favicon 404 suppressed with inline data URI

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
