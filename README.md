# InsightFlow AI

**Thesis:** Cybersecurity Risks of Artificial Intelligence: A Practical Study of Deepfakes, AI-Generated Phishing, and Adversarial Attacks

**AI Cybersecurity Risk Lab** bachelor project report, Instituto Politecnico de Braganca (ESTiG), Informatics Engineering.


- **Student:** Rinor Basholli (69492)
- **Supervisor:** Tiago Pedrosa
- **Live demonstration:** https://ai-cybersecurity-risk-lab-600814116012.us-west1.run.app/
- **Thesis source on GitHub:** this repository


The lab is an educational web application that demonstrates three AI-related cybersecurity risks in one workflow:


1. **AI phishing** generate and analyse emails (conventional, legitimate, and AI-written). The Email Security Check accepts pasted text or a local `.txt` / `.eml` file and judges **wording** with Gemini (or an offline keyword fallback). It is not a spam-filter benchmark.
2. **Deepfake media** inspect video, audio, and image **scenarios**. Bytes are not inspected.
3. **Adversarial image manipulation** — the live **AI Model Attacks** page calls a local Python service that runs FGSM/PGD on a pretrained CIFAR-10 ResNet. Confidences are model outputs (`source: computed`). Gemini is not used to invent those numbers.


It is a React / TypeScript front end with an Express backend. Email generation and several analyses call Google Gemini API (`gemini-3.5-flash`) with deterministic fallbacks when the model is unavailable. Every analytical JSON response includes `source`: `gemini`, `fallback`, or `preset`.


## What this implementation actually does


This is a teaching demonstrator, not a production detector.


| Area | Implemented behaviour |
| --- | --- |
| Dataset | 90 in-memory email samples (30 / 30 / 30) from `generate90Samples()` with **fixed seed 20260927**, plus three authored exemplars and four educational reconstructions of publicly documented scam/notice patterns (not harvested from a live mailbox) |
| Live email check | POST `/api/analyze-email` with subject, body, and optional sender. Predicted class comes from Gemini or the fallback heuristic **not** from a `critical`/`urgent` keyword shortcut. Known samples keep their teaching label. |
| File paste | `.txt` / `.eml` load in Email Security Check; parsed From/Subject/body is sent to the same Gemini check |
| Storage | Client `useState` only. The footer can say DB ACTIVE; there is no database |
| Deepfakes | Three hardcoded presets in `PRE_BAKED_DEEPFAKES`(**exact** filename match). Bytes are not inspected. Marker confidence is simulated |
| Adversarial | Local Python eval (`eval/adversarial`) runs FGSM/PGD on a pretrained CIFAR-10 ResNet. Express calls that API. Raw metrics: `eval/adversarial/results/adversarial_metrics.json`. |
| Dashboard 75% / 51% | Mean designed realism and `100 − mean AI detectability`. Configuration from template bands, not findings. |
| Displayed ASR | For the teaching canvas only. Measured ASR is in `eval/adversarial/results/adversarial_metrics.json`. |

## Real evaluations

```sh
python3 eval/phishing/run_benchmark.py
python3 eval/adversarial/run_attacks.py
python3 eval/adversarial/service.py
npm run dev
```

Phishing metrics: accuracy, precision, recall, F1, AUC in `eval/phishing/results/phishing_metrics.json`.
Spot-check `eval/phishing/results/MANUAL_REVIEW.csv` yourself before the viva.

The live site uses HTTP Basic Auth (`LAB_BASIC_USER` / `LAB_BASIC_PASS` in `.env.local` or Cloud Run secrets). Do not commit those values.

## Live Simulate on Cloud Run

AI Studio only publishes the Node website. The real attack needs a second Cloud Run service (Python + PyTorch).

1. Laptop: `python3 eval/adversarial/service.py` then `npm run dev`. Simulate is already live locally.
2. Cloud: deploy `eval/adversarial/Dockerfile` with `deploy/deploy-eval-cloudrun.sh`, then set secrets on the website service:
   - `EVAL_API_URL` = the eval service URL
   - `EVAL_INTERNAL_TOKEN` = the same token
3. Do **not** republish from AI Studio after a custom all-in-one image, or Studio will overwrite it. Prefer the two-service setup above.

Cloud deploy needs `gcloud`, `docker`, and login to project `gen-lang-client-0937101162`.

## Origin of the first website

The first website was started in Google AI Studio. Leftover Word report files were removed. Gemini is used on the teaching email routes and labelled `source: gemini | fallback | preset`. The FGSM/PGD and phishing F1/AUC numbers come from the Python scripts, not from Gemini. I, Rinor Basholli, defend every number.
