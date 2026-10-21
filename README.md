# Virtual Photo Booth 📸

A free, web-based photo booth — live camera capture with countdown and burst sessions, classic 3-photo strips and 4-photo grids, filters, frames, captions, synthesized sounds, and one-tap share or download.

**Everything runs on-device.** No backend, no accounts, no uploads — your photos never leave your browser.

## Why

Existing collage apps (like SCRL) let you edit *existing* photos into scrolling collages — but require an install, manual curation, and a paid tier. Virtual Photo Booth is the other half of that workflow: open a link, strike a pose through a guided countdown session, and walk away with a shareable photo strip in ~30 seconds. Fully free, no install, and private by design.

## Features

### Capture session
- **Photo layouts** — classic 3-photo strip or 4-photo grid
- **Adjustable timers** — get-ready countdown (Off / 3s / 5s / 10s) and gap between shots (Instant / 1.5s / 3s), persisted between visits
- **Pose prompts** — rotating on-screen suggestions with a "Photo N of M" counter
- **Synthesized sounds** — countdown beeps, "Smile!" chime, shutter click, and printer whirr, all generated with the Web Audio API (zero audio assets) with a mute toggle
- **Camera warm-up** — spinner while the camera starts; the shutter stays disabled until the first frame decodes
- **Keyboard shortcuts** — `Space`/`Enter` to start, `R` to retake the whole set, `Esc` to cancel then exit

### Result view
- **Printer eject animation** — your photo card slides out of a printer slot, just like the real thing
- **6 filters** — Vintage, B&W, Sunny, Cool, Faded, or None
- **6 frames** — Classic, **Auto** (a pastel tint derived from your photos), Charcoal, Soft, Gold, and **Deckle** (torn-edge)
- **Per-photo retake** — tap any photo on the card to reshoot just that slot
- **Caption + date stamp** — opt-in, 40-character cap, frame-aware color, baked into downloads and shares
- **Share anywhere** — Web Share API on mobile (native share sheet), clipboard PNG fallback on desktop

### Accessibility
- `aria-live` announcements for countdown, shutter, progress, and cancels
- `aria-pressed` state on all toggles, full keyboard operability
- Deliberate focus choreography between booth and result views
- `prefers-reduced-motion` support throughout

## Tech stack

| Layer | Choice |
|---|---|
| Build | Vite 8 |
| UI | React 19 + TypeScript (strict) |
| Styling | Tailwind CSS v4 (via `@tailwindcss/postcss`) |
| Camera | react-webcam |
| Card rendering / export | html-to-image |
| Linting | oxlint |
| Persistence | `localStorage` (preferences only) |

No router, no state library, no backend, no analytics.

## Getting started

Requires Node.js 18+.

```bash
git clone https://github.com/BhavikSharma2010/Photo-Booth.git
cd Photo-Booth
npm install
npm run dev
```

Open the printed local URL and grant camera access. To test on a phone over your LAN:

```bash
npm run dev -- --host
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |

## Project structure

```
src/
├── App.tsx                      # Landing page (hero, parallax strip, CTA)
├── components/
│   ├── CameraBooth.tsx          # Booth orchestrator — owns all session state
│   ├── Viewfinder.tsx           # Live camera, flash, thumbnails, action bar
│   ├── ResultView.tsx           # Printer eject, pickers, caption, actions
│   ├── PhotoBoothPreview.tsx    # The printed card (download/share target)
│   ├── PoseOverlay.tsx / HeroStrip.tsx / ResultActions.tsx
│   └── ui/                      # FilterPicker, FramePicker, PhotoFitPicker,
│                                # LayoutFormatToggle, TimerSettings, MuteButton…
├── hooks/
│   ├── useCaptureSession.ts     # Countdown + shot loop state machine
│   ├── useAudioCues.ts          # Synth sound cues + mute
│   ├── usePosePrompt.ts         # Rotating pose suggestions
│   ├── useCameraReady.ts        # First-frame detection gate
│   ├── useAnnouncer.ts          # aria-live announcements
│   └── useKeyboardShortcuts.ts  # Space / R / Esc handling
├── lib/
│   ├── audio.ts                 # Web Audio synth (beep, shutter, print)
│   ├── photoColors.ts           # Auto-frame tint from photo averages
│   ├── preferences.ts           # localStorage persistence
│   └── posePrompts.ts / patterns.ts
└── types/                       # Layout, filter, frame, photo-fit, timer types
```

## Privacy

Photos are captured, processed, and rendered entirely in your browser using the camera MediaStream API and canvas rendering. Nothing is transmitted, stored server-side, or logged — the only data persisted is your own UI preferences (timer, mute, caption settings) in `localStorage`.

## Roadmap

- [ ] **Capture → Carousel** (signature feature) — shoot a set, one tap → seamless Instagram carousel slices
- [ ] Editor-lite — import existing gallery photos, arrange/reorder shots
- [ ] Stickers
- [ ] Gallery persistence (IndexedDB)
- [ ] Print / PDF export
- [ ] Events & party wall — QR join + shared gallery

## License

MIT
