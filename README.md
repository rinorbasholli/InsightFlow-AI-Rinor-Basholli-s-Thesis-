# InsightFlow AI

**AI Cybersecurity Risk Lab** — bachelor project report, Instituto Politécnico de Bragança (ESTiG), Informatics Engineering.

- **Student:** Rinor Basholli
- **Supervisor:** Tiago Pedrosa
- **Live demonstration:** https://ai-cybersecurity-risk-lab-600814116012.us-west1.run.app/
- **Thesis source on GitHub:** this repository

The lab is an educational web application that demonstrates three AI-related cybersecurity risks in one workflow:

1. **AI phishing** — generate and analyse emails (conventional, legitimate, and AI-written).
2. **Deepfake media** — inspect video, audio, and image scenarios.
3. **Adversarial image manipulation** — show how small perturbations can be used to trick a classifier (sidebar label: **AI Model Attacks**).

It is a React / TypeScript front end with an Express backend. Email generation and several analyses call Google’s Gemini API (`gemini-3.5-flash`) with deterministic fallbacks when the model is unavailable.

## What this implementation actually does

This is a teaching demonstrator, not a production detector.

| Area | Implemented behaviour |
| --- | --- |
| Dataset | 90 in-memory email samples (30 legitimate, 30 conventional phishing, 30 AI phishing), plus three authored exemplars |
| Storage | Client `useState` only. The footer can say “DB ACTIVE”; there is no database |
| Deepfakes | Three hardcoded presets in `PRE_BAKED_DEEPFAKES` (filename match). Bytes are not inspected |
| Adversarial | Gemini is asked to narrate an FGSM/PGD-style outcome, or fallback constants (e.g. 98.4 / 86.2) are returned. No real gradients |
| Filter Failure Rate | `100 − mean AI-phishing detectability` on the loaded samples, not a measurement against Gmail or SpamAssassin |
| Displayed ASR | UI threshold on target confidence (`> 80` → 98.5%, else 84.2%), not a measured attack success rate |

## Run locally

**Prerequisite:** Node.js 20+.

```bash
npm install
```

Create `.env.local` from `.env.example` and set a Gemini API key:

```bash
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```

The app listens on http://localhost:3000.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server (`tsx server.ts`) |
| `npm run build` | Production bundle |
| `npm run start` | Run the built server |
| `npm run lint` | Typecheck (`tsc --noEmit`) |

## Laboratory views

Sidebar labels in the live app:

- Dashboard Overview
- AI Phishing Lab
- Deepfake Media Lab
- AI Model Attacks

Deepfake filename presets:

- `ceo_keynote_urgent_wire.mp4`
- `financial_analyst_voicemail.wav`
- `id_verification_passport.png`

## HTTP API

| Method | Path | Role |
| --- | --- | --- |
| POST | `/api/generate-phishing` | Generate a phishing email |
| POST | `/api/analyze-email` | Score and explain an email |
| POST | `/api/analyze-media-deepfake` | Deepfake narrative / preset lookup |
| POST | `/api/adversarial-perturb` | Simulated perturbation result |

## Honesty for evaluators

Clone this public repository; no access request is required. Scores shown in the UI mix dataset design, LLM estimates, and fallback constants. Future work (persistent storage, trained classifiers, real media forensics, true FGSM/PGD on a model) is listed in the thesis, not claimed here.
