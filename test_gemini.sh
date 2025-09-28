#!/usr/bin/env bash
set -euo pipefail

: "${GEMINI_API_KEY:?Please export GEMINI_API_KEY first}"

MODEL_ID="gemini-2.5-flash-image-preview"
ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:streamGenerateContent?key=${GEMINI_API_KEY}"

cat > request.json <<'JSON'
{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "Generate a tiny image of a cat in sunglasses and describe it in one sentence." }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE", "TEXT"]
  }
}
JSON

curl -N -sS \
  -H "Content-Type: application/json" \
  -X POST "${ENDPOINT}" \
  -d @request.json

