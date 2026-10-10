# Photo Booth — Project Progress & Context

> Standing context document. Read this first in every new session; update it whenever significant work lands or decisions are made. Last updated: 2026-09-07.

---

## 1. What this project is

**Virtual Photo Booth** — a free, web-based photo booth: live camera capture with countdown/burst sessions, classic photo strips & 4-shot grids, filters, frames, captions, sounds, and one-tap share/download. Everything runs **on-device** (no backend, no uploads).

**Positioning:** competitor to **SCRL** (the seamless-scroll Instagram collage app).

| | SCRL | Us |
|---|---|---|
| Core | Edit existing photos into seamless scrolling collages | **Live capture** booth experience (countdown, burst, sounds, printer eject) |
| Speed | Manual curation | Open → shoot → shareable in ~30 seconds |
| Access | Native app install (freemium) | A link — free, no install, private on-device |

**Agreed product direction:** our signature feature will be **capture → seamless Instagram carousel** (shoot a set, one tap → scrollable carousel slices) — fusing our capture DNA with SCRL's best idea.

## 2. Tech stack

- **Vite 8 + React 19 + TypeScript** (strict flags: `verbatimModuleSyntax` → always `import type`; `erasableSyntaxOnly` → no enums, use string-literal unions)
- **Tailwind CSS v4** via `@tailwindcss/postcss` — no `tailwind.config.js` in use; arbitrary-value utilities + custom classes/keyframes live in `src/index.css`
- **react-webcam** (camera), **html-to-image** (strip rendering for download/share)
- **oxlint** for linting. No router, no state library, no backend, **no test framework** — verification = `npm run lint`, `npm run build`, manual `npm run dev` passes

## 3. Architecture map

```
App.tsx (landing: hero, social header links, HeroStrip parallax, shutter-flash CTA, bold footer)
└─ CameraBooth.tsx (orchestrator: owns all state, wires the hooks below)
   ├─ hooks/useCaptureSession   — countdown + shot loop state machine (instant = double-rAF + 250ms floor)
   ├─ hooks/useAudioCues        — mute state over lib/audio (Web Audio synth; module singleton,
   │                              primed in user gestures, NEVER created/closed in effects — StrictMode)
   ├─ hooks/usePosePrompt       — rotating pose prompts (advance per tick/shot, restart per session)
   ├─ hooks/useCameraReady      — polls video element until first frame decodes (gates shutter + spinner)
   ├─ hooks/useAnnouncer        — aria-live announcements (countdown, "Smile!", progress, cancels)
   ├─ hooks/useKeyboardShortcuts— Space/Enter start, R retake-all, Esc cancel→exit chain
   ├─ Viewfinder.tsx            — Webcam, warm-up spinner, PoseOverlay, flash, thumbnail rail,
   │                              timer/mute cluster, action bar (layout toggle / shutter / flip)
   └─ ResultView.tsx            — printer slot + eject animation, FilterPicker / FramePicker,
                                  caption toggle + text field, ResultActions (Retake / Share / Download)
       └─ PhotoBoothPreview.tsx — the printed card = the html-to-image download target
```

**Libs:** `lib/audio.ts` (synth cues: beep/beepFinal/shutter/print), `lib/photoColors.ts` (`derivePhotoTint` — Auto frame's background from photo averages), `lib/preferences.ts` (localStorage `photobooth:settings`: timer, mute, caption on/text), `lib/posePrompts.ts`.

**Types:** `photoLayout` (`strip-3`/`grid-4` + `PHOTOS_PER_LAYOUT`), `photoFilter` (none/vintage/bw/sunny/cool/faded), `photoFrame` (classic/auto/charcoal/soft/gold/deckle), `timerSettings` (countdown off/3/5/10s, gap instant/1.5s/3s).

## 4. Feature inventory (done — currently UNCOMMITTED)

- Adjustable **timer settings**: get-ready countdown (Off/3/5/10s) + gap between shots (Instant/1.5s/3s), persisted; locked mid-session
- **Synthesized sounds** (countdown beeps, "Smile!" chime, shutter click, printer whirr) + mute — zero audio assets
- **Pose prompts** + visible "Photo N of M" counter
- **Per-photo retake** (tap a photo on the card → reshoot just that slot, no second print animation) + whole-set Retake
- **Keyboard shortcuts** (Space/Enter start, R retake-all, Esc cancel-then-exit; button-safe, modifier-safe)
- **Camera warm-up** spinner; shutter gated until first frame decodes
- **A11y**: aria-live announcements, aria-pressed everywhere, focus choreography (result heading ← eject; shutter ← retake entry; retaken slot ← retake done), prefers-reduced-motion coverage
- **6 filters × 6 frames** — incl. **Auto** (photo-derived pastel tint baked into output) and **Deckle** (clip-path torn edge on dark download background)
- Result view: horizontal scroll picker rows (hidden scrollbar + edge fade), height-aware card sizing (`.result-card-strip/.result-card-grid`) → no visible scrollbar, nothing clipped
- **Share** button: Web Share API with image file (mobile sheet) → clipboard PNG fallback (desktop); abort ≠ error; status line auto-clears
- **Optional caption + date stamp** (opt-in toggle, 40-char cap, date auto-appended, frame-aware color, persisted, baked into downloads/shares)
- **Landing**: Instagram + LinkedIn header links (brand-hover), shutter-flash CTA transition, floating sample strip with mouse parallax (lg+), bold footer
- Booth backdrop: brand charcoal (`#1C1B1A` → black) with soft top glow

## 5. Hard-won constraints (don't relearn these the hard way)

- **html-to-image download target (`previewRef`)**: no `box-shadow` (clips at node bounds — decorative shadow lives outside it in ResultView), no `mask-image`, no `backdrop-filter`. Deckle frame = `clip-path` + conditional dark `backgroundColor` in the render options. Retake hit buttons are excluded from output via the `filter` option + `data-photo-hit="true"`.
- **Scroll containers must not center content** (`justify-center` + overflow = unreachable content); result children are `shrink-0` under a `my-auto` wrapper.
- **Audio**: module-singleton AudioContext, `primeAudio()` inside user gestures only; never in effects (StrictMode double-mount would kill it).
- **Focus targets**: `#booth-shutter`, `#retake-hit-N`, result heading ref.
- **Git: NO commits or pushes without the user's explicit approval.**
- Design tokens are minimal; keep constants named and in `lib/`/`types/`, not component files (oxlint `react/only-export-components`).

## 6. Current state

- Working tree holds the entire feature set above, **uncommitted** (user testing before approving a commit).
- `npm run lint` and `npm run build` are green.
- Known minor trade-off: with caption enabled, the card gains ~15px and exact-fit short windows may scroll by a sliver (invisibly).

## 7. Next up (not started)

1. **Capture → Carousel** (signature): compose a photo set onto a 1080px canvas → slice into 1080×1350 JPEGs → sequential download, post to Instagram in order for a seamless scroll. Uses existing tint/filter/caption pipeline.
2. **Editor-lite**: import existing gallery photos into the set (auto-layout by count), Arrange mode to reorder shots.
3. Stickers (fast-follow), gallery persistence (IndexedDB), print/PDF export.
4. Bigger bets: events/party wall (QR join + shared gallery — needs a backend), Web Share enhancements.

## 8. Running & verifying

```bash
npm run dev            # local (add -- --host to test on a phone via LAN)
npm run lint           # oxlint
npm run build          # tsc -b && vite build
```
