# InsightFlow AI

**AI Cybersecurity Risk Lab** â bachelor project report, Instituto PolitÃ©cnico de BraganÃ§a (ESTiG), Informatics Engineering.

- **Student:** Rinor Basholli (69492)
- **Supervisor:** Tiago Pedrosa
- **Live demonstration:** https://ai-cybersecurity-risk-lab-600814116012.us-west1.run.app/
- **Thesis source on GitHub:** this repository

The lab is an educational web application that demonstrates three AI-related cybersecurity risks in one workflow:

1. **AI phishing** â generate and analyse emails (conventional, legitimate, and AI-written). The Email Security Check accepts pasted text or a local `.txt` / `.eml` file and judges **wording** with Gemini (or an offline keyword fallback). It is not a spam-filter benchmark.
2. **Deepfake media** â inspect video, audio, and image **scenarios**. Bytes are not inspected.
3. **Adversarial image manipulation** â show how small perturbations can be used to trick a classifier (sidebar label: **AI Model Attacks**). No real model or gradient is used.

It is a React / TypeScript front end with an Express backend. Email generation and several analyses call Googleâs Gemini API (`gemini-3.5-flash`) with deterministic fallbacks when the model is unavailable. Every analytical JSON response includes `source`: `gemini`, `fallback`, or `preset`.

## What this implementation actually does

This is a teaching demonstrator, not a production detector.

| Area | Implemented behaviour |
| --- | --- |
| Dataset | 90 in-memory email samples (30 / 30 / 30) from `generate90Samples()` with **fixed seed 20260927**, plus three authored exemplars and four educational reconstructions of publicly documented scam/notice patterns (not harvested from a live mailbox) |
| Live email check | POST `/api/analyze-email` with subject, body, and optional sender. Predicted class comes from Gemini or the fallback heuristic â **not** from a `critical`/`urgent` keyword shortcut. Known samples keep their teaching label. |
| File paste | `.txt` / `.eml` load in Email Security Check; parsed From/Subject/body is sent to the same Gemini check |
| Storage | Client `useState` only. The footer can say âDB ACTIVEâ; there is no database |
| Deepfakes | Three hardcoded presets in `PRE_BAKED_DEEPFAKES` (**exact** filename match). Bytes are not inspected. Marker âconfidenceâ is simulated |
| Adversarial | Gemini is asked to narrate an FGSM/PGD-style outcome, or fallback constants (e.g. 98.4 / 86.2) are returned. No real gradients. Pre-click confidence is blank; âATTACK SUCCESSâ is not shown before Simulate |
| Filter Failure Rate | `100 â mean AI-phishing detectability` on loaded AI samples (0 if none). Not a measurement against Gmail or SpamAssassin |
| Displayed ASR | UI threshold on target confidence (`> 80` â 98.5%, else 84.2%), labelled as not measured |

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
| POST | `/api/analyze-email` | Score and explain an email (subject, body, optional sender). Returns `source` plus predicted category |
| POST | `/api/analyze-media-deepfake` | Deepfake narrative / preset lookup |
| POST | `/api/adversarial-perturb` | Simulated perturbation result |

## Honesty for evaluators

Clone this public repository; no access request is required. Scores shown in the UI mix dataset design, LLM estimates, and fallback constants. The UI now labels those sources. Future work (persistent storage, trained classifiers, real media forensics, true FGSM/PGD on a model) is listed in the thesis, not claimed here.
