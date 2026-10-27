# InsightFlow AI

**Thesis:** Cybersecurity Risks of Artificial Intelligence: A Practical Study of Deepfakes, AI-Generated Phishing, and Adversarial Attacks

**AI Cybersecurity Risk Lab**, Instituto Politécnico de Bragança (ESTiG), Informatics Engineering.

The submitted written report is the Overleaf PDF. This repository is the laboratory, not the official thesis text.

- **Student:** Rinor Basholli (69492)
- **Demonstration:** `npm run dev` then `http://localhost:3000`

Educational web laboratory for three AI-related cybersecurity risks:

1. **AI phishing** — generate and analyse emails (conventional, legitimate, and AI-written). Email Security Check accepts pasted text or a local `.txt` / `.eml` file.
2. **Deepfake media** — inspect video, audio, and image scenarios. Bytes are not inspected.
3. **Adversarial image manipulation** — FGSM/PGD on a pretrained CIFAR-10 ResNet through a local Python service. Confidences are model outputs (`source: computed`).

React / TypeScript front end with an Express backend. Teaching email routes call Gemini (`gemini-3.5-flash`) when a key is configured, otherwise a deterministic fallback. Analytical JSON includes `source`: `gemini`, `fallback`, `preset`, or `computed`.

## Scope

Teaching demonstrator, not a production detector.

| Area | Behaviour |
| --- | --- |
| Dataset | 90 in-memory email samples (30 / 30 / 30) from `generate90Samples()` with seed `20260927`, plus authored exemplars and educational reconstructions of public scam/notice patterns |
| Live email check | `POST /api/analyze-email` |
| Storage | Client `useState` only |
| Deepfakes | Three filename presets in `PRE_BAKED_DEEPFAKES`. Bytes are not inspected |
| Adversarial | `eval/adversarial` — FGSM/PGD on CIFAR-10 ResNet. Metrics: `eval/adversarial/results/adversarial_metrics.json` |
| Dashboard 75% / 51% | Configuration from template bands, not findings |

## Evaluations

```sh
python3 eval/phishing/run_benchmark.py
python3 eval/adversarial/run_attacks.py
python3 eval/adversarial/service.py
npm run dev
```

Phishing metrics: `eval/phishing/results/phishing_metrics.json`.

## Run

```sh
cp .env.example .env.local
npm install
python3 eval/adversarial/service.py &   # needed for Simulate
npm run dev
```

Open `http://localhost:3000` and sign in.

```sh
docker build -t insightflow-lab .
docker run -p 8080:8080 --env-file .env.local -e NODE_ENV=production insightflow-lab
```

## Simulate (adversarial tab)

```sh
python3 eval/adversarial/service.py
```

Express proxies `/api/adversarial-perturb` to `EVAL_API_URL` (default `http://127.0.0.1:8001`). If that process is down, the route returns 503.

## Use of generative AI

- **In the application:** the teaching email routes and non-preset deepfake scenarios call the Gemini API (`gemini-3.5-flash` by default). Every analytical response carries `source` (`gemini`, `fallback`, `preset` or `computed`). Gemini is never used for adversarial results.
- **In producing the work:** I used Cursor to help write parts of the application. I used Claude (Anthropic) in the last editing pass to check code and evaluation scripts and to apply changes I reviewed (phishing benchmark splits and grouped-domain CV, attack-service $L_\infty$ check, login limits and provenance display). I specified the 187-email corpus; I wrote some samples and reconstructed others from public patterns; Cursor drafted the rest of the wording; I checked the labels. All Chapter 6 numbers come from the scripts in `eval/`. The full declaration is Appendix A of the Overleaf report.
