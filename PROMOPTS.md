# BreatheSG - Conversation & Prompt History

This document contains the complete record of user prompts, requirements, engineering decisions, and technical implementations for **BreatheSG** (Singapore Live PSI & Air Quality Monitoring App).

---

## Turn 1: Initial Application Build

### User Request
> build a singapore based application that tracks live PSI levels and alerts users when air quality drops to unhealthy ranges. It should include an interactive map and push notifications.
>
> build just the front end for now, i will add the serverless backend connection later.

### Engineering Decisions & Actions Taken
1. **Domain Context & NEA Standards**:
   - Implemented official Singapore National Environment Agency (NEA) PSI categories:
     - Good (0–50)
     - Moderate (51–100)
     - Unhealthy (101–200)
     - Very Unhealthy (201–300)
     - Hazardous (>300)
   - Supported 1-hr PM2.5 concentration bands (Band I Normal, Band II Elevated, Band III High, Band IV Very High) for real-time haze action.
2. **Interactive Singapore Sector Map** (`src/components/SingaporeMap.tsx`):
   - Created vector SVG map representing the 5 official NEA sectors: North, South, East, West, Central, plus Sentosa, Jurong Island, Pulau Ubin, and Pulau Tekong.
   - Dynamic metric switcher (24-hr PSI, 1-hr PM2.5, NEA Band).
   - Station markers with live status badges and wind dispersion overlay.
3. **Web Push Notification Engine** (`src/services/notificationService.ts` & `src/components/AlertSettingsModal.tsx`):
   - Integrated browser Notification API with user permission prompt (`Notification.requestPermission()`).
   - Web Audio API dual-tone synthesized warning chimes.
   - Configurable trigger thresholds, sector targeting, test notification button, and persistent notification history.
4. **Health Advisories & Trends** (`src/components/HealthAdvisory.tsx`, `src/components/HistoricalTrend.tsx`):
   - Official NEA/MOH health guidelines categorized by persona: Healthy Persons, Vulnerable Groups (Elderly & Children), and Chronic Illness.
   - 24-hour historical chart with scrubber.
5. **Data Integration & Simulation** (`src/services/psiApi.ts`, `src/components/SimulationControls.tsx`):
   - Live fetching from `data.gov.sg` with seamless fallback.
   - Built-in simulation switchers (Clean Marine Air, Unhealthy Haze Flare, Severe Transboundary Surge) to test push alerts immediately.

---

## Turn 2: Bug Fix - SVG Attribute `cy` NaN Warning

### User Request
> Fix the errors in the app
> [AIS_METADATA_SECTION_START]
> fix_it_trigger: manual
> error 0: Received NaN for the `%s` attribute. If this is expected, cast the value to a string. cy
> [AIS_METADATA_SECTION_END]

### Root Cause Analysis
- The official `data.gov.sg` API response contains geographic sectors (`central`, `east`, `north`, `south`, `west`), but omits a pre-computed `national` key.
- Because `selectedRegion` defaulted to `'national'`, `pt.psi['national']` returned `undefined`.
- In JavaScript, `Math.max(..., undefined)` returns `NaN`. Consequently, the Y-axis coordinate formula `(val - 0) / (maxVal * 1.15)` computed `NaN` for `pt.y`.
- When rendered onto `<circle cx={pt.x} cy={pt.y} />`, React raised: `Received NaN for the 'cy' attribute`.

### Solution Implemented
1. Added `ensureRegionalValues()` helper in `src/services/psiApi.ts` to compute the composite national average `(north + south + east + west + central) / 5`.
2. Added fallback checks in `src/components/HistoricalTrend.tsx` ensuring `val`, `maxVal`, and `pt.y` are guaranteed finite numbers.
3. Added explicit null checks for threshold lines (`unhealthyY` and `moderateY`).
4. Verified clean build with `compile_applet` and `lint_applet`.

---

## Turn 3: Git Repository Initialization & Initial Push

### User Request
> git push https://<ghp_REDACTED_TOKEN>@https://github.com/chiayuting88-byte/haze-watcher.git

### Actions Taken
1. Cleaned up URL formatting typo from copy-paste to standard Git token syntax:
   `https://<GITHUB_PAT>@github.com/chiayuting88-byte/haze-watcher.git`
2. Initialized Git repository, configured author details (`chiayuting88-byte`, `chiayuting.88@gmail.com`).
3. Committed all initial files to `main` branch.
4. Pushed commit to remote repository at `github.com/chiayuting88-byte/haze-watcher.git`.
5. Set `origin` remote for future commands.

---

## Turn 4: Serverless API Connection

### User Request
> add a serveless API connection that pulls live data from data.gov.sg using the following endpoint:
>
> GET https://api-open.data.gov.sg/v2/real-time/api/psi
>
> 1. store this in /api folder in the project root level, NOT the src folder
> 2. include /health.ts and /psi.ts within the same subfolder
> 3. there is no key required for this service

### Technical Architecture & Implementation
1. **`/api/psi.ts`**:
   - Calls `GET https://api-open.data.gov.sg/v2/real-time/api/psi`.
   - Normalizes readings across all 5 sectors plus computed `national` composite average.
   - Includes 30-second in-memory caching with `Cache-Control: public, s-maxage=30, stale-while-revalidate=60`.
   - Compatible with Vercel, Netlify, Next.js Edge, and Express.
2. **`/api/health.ts`**:
   - Health check endpoint returning `{ status: "ok", service: "breathe-sg-psi-api", uptime, upstream }`.
3. **`server.ts`**:
   - Full-stack Express runner mounting `/api/psi` and `/api/health`.
   - Mounts Vite middlewares in development mode on port 3000.
4. **`package.json`**:
   - Updated scripts: `"dev": "tsx server.ts"` and `"start": "node server.ts"`.
5. **`src/services/psiApi.ts`**:
   - Updated client to fetch `/api/psi` first, with automatic fallback to direct data.gov.sg endpoints.

---

## Turn 5: Git Push Serverless Updates

### User Request
> git push

### Actions Taken
1. Staged modified files (`package.json`, `src/services/psiApi.ts`, `src/components/HistoricalTrend.tsx`) and newly created files (`api/health.ts`, `api/psi.ts`, `server.ts`).
2. Created commit: `"Add serverless API endpoints /api/health and /api/psi with data.gov.sg integration"`.
3. Pushed to remote `origin/main` on `https://github.com/chiayuting88-byte/haze-watcher.git`.

---

## Turn 6: Markdown Export

### User Request
> export this entire chat as an .md file -> PROMOPTS.md

### Action Taken
- Generated `PROMPTS.md` and `PROMOPTS.md` in the repository root documenting the end-to-end conversation, architecture, bug fixes, and deployment logs.
