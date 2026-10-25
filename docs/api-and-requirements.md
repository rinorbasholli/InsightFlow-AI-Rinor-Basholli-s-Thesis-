# InsightFlow AI — API contracts and requirements

API contracts, requirements, and tests for the teaching laboratory in this repository.

## Functional requirements

| ID | Requirement | Implemented by |
| --- | --- | --- |
| FR-1 | Generate an educational phishing email from a scenario, prompt text, optional custom instructions, and complexity. | `POST /api/generate-phishing` |
| FR-2 | Analyse pasted or generated email wording (subject, body, optional sender) and return scores plus `predictedCategory`. | `POST /api/analyze-email` |
| FR-3 | Return a structured deepfake *scenario* analysis. Exact preset filenames return hardcoded JSON. Other names are narrated from text. Media bytes are not inspected. | `POST /api/analyze-media-deepfake` |
| FR-4 | Run a real FGSM (default) or PGD attack on a pretrained CIFAR-10 ResNet via the Python eval service. Gemini is not used to invent confidences. | `POST /api/adversarial-perturb` → `EVAL_API/attack` |
| FR-5 | Expose eval-service health and frozen metric files for the report. | `GET /api/eval/health`, `GET /api/eval/adversarial`, `GET /api/eval/phishing` |
| FR-6 | Protect every API with HTTP Basic Auth **or** a login cookie when `LAB_BASIC_USER` and `LAB_BASIC_PASS` are set. The React login screen is the page lock; `/api/login` is the only unauthenticated POST. | `requireLabAccess` in `labSecurity.ts` |
| FR-7 | Serve the React teaching UI (phishing, deepfake, adversarial, dashboard). | Vite middleware in development; `dist/` in production |
| FR-8 | Label every successful analytical JSON with `source` so examiners can see whether Gemini, a fallback, a preset, or a computed eval ran. | Response field `source` |

## Non-functional requirements

| ID | Requirement | Implemented by |
| --- | --- | --- |
| NFR-1 | JSON request bodies are limited to **32kb**. | `express.json({ limit: '32kb' })` in `server.ts` |
| NFR-2 | Hourly per-IP per-path rate limits on `POST /api/*`: **10**/hour for `/api/generate-phishing`, **40**/hour for other POST API routes. GET is not limited. | `rateLimitApi` |
| NFR-3 | Reject obvious prompt-injection strings on phishing generation (`ignore previous/prior/above instructions`, `you are now `, `disregard the system/developer`). Normal phishing-task prompts pass. | `promptLooksInjected` on `POST /api/generate-phishing` only |
| NFR-4 | Compare Basic Auth credentials with `crypto.timingSafeEqual`. Empty or length-mismatched secrets fail. | `timingSafeEqualString` |
| NFR-5 | **Fail-closed in production:** if `LAB_BASIC_USER` or `LAB_BASIC_PASS` is missing and `NODE_ENV === 'production'`, respond **503** and do not serve the lab. Non-production with unset credentials stays open for local development. | `requireLabAccess` |
| NFR-6 | Do not store secrets in git. Example keys only in `.env.example`. | `.gitignore`, this document |
| NFR-7 | Eval service may require `X-Eval-Token` when `EVAL_INTERNAL_TOKEN` is set. Express forwards that header. | `server.ts`, `eval/adversarial/service.py` |
| NFR-8 | Teaching email generate/analyse routes degrade to deterministic fallbacks if Gemini is unavailable. The adversarial route does **not** invent numbers: it returns 503 if the eval service is down. | Route handlers |
| NFR-9 | Automated tests run offline with `npx tsx --test tests/*.test.ts` and must not call Gemini. | `tests/*.test.ts` |

## Use cases

1. **Examiner opens the lab.** Browser hits Express. In production, missing Basic Auth env vars close the lab (503). With credentials set, a Basic Auth challenge is issued until the examiner pair is accepted.
2. **Student generates a teaching phishing email.** UI posts scenario text. Injection patterns are rejected with 400. Otherwise Gemini is called; on API failure a fixed fallback email is returned (`source: fallback`).
3. **Student inspects an email.** UI posts subject/body/sender. Gemini or the keyword heuristic returns scores and `legitimate` / `conventional_phishing` / `ai_phishing`.
4. **Student inspects a deepfake scenario.** Exact names `ceo_keynote_urgent_wire.mp4`, `financial_analyst_voicemail.wav`, or `id_verification_passport.png` return `source: preset`. Other names call Gemini or a dynamic fallback.
5. **Student runs Simulate on AI Model Attacks.** Express posts to the Python eval service. Success bodies use `source: computed`. If the service is down: 503, `source: unavailable`.
6. **Author exports Chapter 6–7 numbers.** `GET /api/eval/adversarial` and `GET /api/eval/phishing` serve the JSON files produced by the Python runners.

## Architecture

```
Browser (React / Vite)
        |  HTTP Basic Auth + JSON ≤ 32kb
        v
Express (server.ts)
  requireLabAccess → rateLimitApi → route
        |                         |
        | Gemini (generate / analyse / non-preset deepfake)
        |                         |
        +---- EVAL_API (default http://127.0.0.1:8001)
              GET /health, POST /attack
              optional X-Eval-Token
```

There is no application database. The dashboard keeps samples in React `useState`. Metric files under `eval/*/results/` are artefacts, not a runtime store.

## Sequence notes

**Phishing generate (success / fallback)**

1. Client `POST /api/generate-phishing`.
2. `promptLooksInjected(customPrompt + promptText)` → 400 if matched.
3. Gemini `generateContent` with a JSON schema.
4. `200 { success: true, source: "gemini", email }` or, on throw, `200 { success: true, source: "fallback", email }`.

**Adversarial (computed / down)**

1. Client `POST /api/adversarial-perturb`.
2. Express `fetch(EVAL_API + "/attack")` with the same JSON fields plus `method: "fgsm"`.
3. Eval service loads CIFAR-10, runs FGSM/PGD, returns model softmax values (`source: computed`).
4. If `fetch` fails: `503 { success: false, source: "unavailable" }`. Gemini is not a substitute.

## Data model (request / response shapes)

No persistent schema. In-memory teaching types live in `src/types.ts` (`EmailCategory`, `PhishingEmail`, `AnalysisResult`). Live API payloads:

- Email category enum: `legitimate` | `conventional_phishing` | `ai_phishing`.
- Deepfake marker: `{ name, description, confidence, category }` where category is `physical` | `temporal` | `acoustic` | `digital`.
- Success `source` contract: `gemini` | `fallback` | `preset` | `computed`.
- Error-only adversarial label: `unavailable` (not a success source).

## HTTP API

All routes below go through `requireLabAccess` and, for `POST /api/*`, `rateLimitApi`. Oversized JSON is rejected by Express (`413` from the 32kb limiter). Rate-limit response:

```json
{ "success": false, "error": "Hourly API limit exceeded for this address." }
```

Client IP is the first `X-Forwarded-For` hop, else `req.ip`, else the socket address. Counters are `${ip}:${path}` in a process-local map (lost on restart).

### `POST /api/generate-phishing`

Body: `{ scenario, promptText, customPrompt, complexity }`.

Injection: `400 { success: false, error: "Prompt rejected by input validation." }`.

Success: `{ success: true, source: "gemini" | "fallback", email: { subject, body, realismScore, spoofingIndicators, mitigationRules } }`.

Limit: 10 POST/hour/IP.

### `POST /api/analyze-email`

Body: `{ subject, body, sender }`.

Success: `{ success: true, source: "gemini" | "fallback", analysis }` with `realismScore`, `detectabilityScore`, `languagePolish`, `urgencyLevel`, `detectionDifficulty`, `indicators`, `mitigationRules`, `detailedAnalysis`, `predictedCategory`, `categoryRationale`.

Gemini `predictedCategory` is normalised by `normalizeEmailCategory`. Fallback is a keyword heuristic (not a mail-filter measurement). Limit: 40 POST/hour/IP.

### `POST /api/analyze-media-deepfake`

Body: `{ fileName, mediaType, promptAnalysis }`.

Exact preset filename (case-insensitive) → `{ success: true, source: "preset", deepfakeAnalysis }`.

Otherwise Gemini or `{ success: true, source: "fallback", deepfakeAnalysis }`.

`deepfakeAnalysis`: `facialIrregularities`, `audioAnomalies`, `simulatedClassification`, `markers`, `actionableDefences`. Bytes are never read. Limit: 40 POST/hour/IP.

### `POST /api/adversarial-perturb`

Body: `{ originalClass, targetClass, noiseLevel, architecture }`.

Proxied to `EVAL_API/attack` (default `http://127.0.0.1:8001`) with `method: "fgsm"` and optional `X-Eval-Token`.

Success (eval service): `{ success: true, source: "computed", perturbation: { originalClass, originalConfidence, targetClass, targetConfidence, noiseStrength, mathematicalLogs, robustDefenseSteps, ... } }`.

Eval rejection: `502 { success: false, error }`. Unreachable: `503 { success: false, source: "unavailable", error }` — Gemini is not used. Limit: 40 POST/hour/IP.

### `GET /api/eval/health`

Fetches `${EVAL_API}/health` (optional `X-Eval-Token`). Success: `{ success, evalApi, eval }`. Unreachable: `503 { success: false, evalApi, error }`.

### `GET /api/eval/adversarial`

Serves `eval/adversarial/results/adversarial_metrics.json` or `404` asking to run `python3 eval/adversarial/run_attacks.py`.

### `GET /api/eval/phishing`

Serves `eval/phishing/results/phishing_metrics.json` or `404` asking to run `python3 eval/phishing/run_benchmark.py`. Frozen file uses `"source": "computed"`.

## Auth (fail-closed)

| Environment | `LAB_BASIC_USER` + `LAB_BASIC_PASS` | Behaviour |
| --- | --- | --- |
| `NODE_ENV === 'production'` | missing / blank | **503**, lab closed |
| non-production | missing / blank | open (local `npm run dev`) |
| any | both set | login cookie (`POST /api/login`) **or** HTTP Basic Auth; wrong pair → **401** |

Static HTML/JS is served so the login page can render. Every `/api/*` route except `/api/login` and `/api/logout` stays locked. Realm for Basic Auth: `InsightFlow AI academic laboratory`. Values are compared with `timingSafeEqualString`. Deliver the pair to Pedrosa, examiners, and the bachelor director out of band — not in this repository.

## Prompt injection (A7)

`promptLooksInjected` is a small denylist, not a general jailbreak defence. It is applied only to the generate-phishing user fields. Analyse-email, deepfake, and adversarial routes do not run this helper. Combined with the 32kb cap and Gemini JSON schemas, it is a teaching-lab mitigation, not a security guarantee.

## Ethics / dual use

The phishing generator and deepfake studio exist to teach recognition and mitigation. Generated mail is for academic comparison, not sending. Deepfake routes do not process uploaded media bytes. Adversarial attacks run on CIFAR-10 class images, not production identity systems. Rate limits and auth exist so the laboratory is not an open generator.

## Automated tests

```sh
npx tsx --test tests/*.test.ts
```

Coverage (no Gemini network calls):

- `timingSafeEqualString`, `labCredentials`
- `promptLooksInjected` (injection strings vs normal phishing-task prompts)
- `clientIp`, exported `rateLimitApi` (10 / 40 / skip GET)
- `requireLabAccess` fail-closed in production
- Contract: 32kb limiter, four POST routes, three eval GET routes, success sources `gemini|fallback|preset|computed`

Environment variables used in tests are dummy values restored in `finally` blocks.
