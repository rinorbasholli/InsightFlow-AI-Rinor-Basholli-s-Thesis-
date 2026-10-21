#!/usr/bin/env bash
# Deploys the Python attack API to Cloud Run. The existing website service
# then gets EVAL_API_URL + EVAL_INTERNAL_TOKEN so Simulate is live.
set -euo pipefail
PROJECT="${GCP_PROJECT:-gen-lang-client-0937101162}"
REGION="${GCP_REGION:-us-west1}"
SERVICE="${EVAL_SERVICE:-insightflow-adversarial-eval}"
TOKEN="${EVAL_INTERNAL_TOKEN:?Set EVAL_INTERNAL_TOKEN to a long random string}"

gcloud builds submit --project "$PROJECT" --tag "gcr.io/${PROJECT}/${SERVICE}" \
  -f eval/adversarial/Dockerfile .

gcloud run deploy "$SERVICE" \
  --project "$PROJECT" \
  --region "$REGION" \
  --image "gcr.io/${PROJECT}/${SERVICE}" \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --no-allow-unauthenticated \
  --set-env-vars "EVAL_INTERNAL_TOKEN=${TOKEN}"

EVAL_URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)')"
echo "Eval URL: $EVAL_URL"
echo "Set these on the website Cloud Run / AI Studio secrets, then republish:"
echo "  EVAL_API_URL=$EVAL_URL"
echo "  EVAL_INTERNAL_TOKEN=$TOKEN"
echo "Also grant the website service account Cloud Run Invoker on $SERVICE."
