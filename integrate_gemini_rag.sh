#!/usr/bin/env bash
set -euo pipefail

# Configuration (override via env)
SERVICES_DIR="${SERVICES_DIR:-services}"
SERVICE_NAME="${SERVICE_NAME:-gemini_rag}"
REPO_URL="${REPO_URL:-https://github.com/promptadvisers/gemini-rag-file-search}"

PORT="${RAG_PORT:-5001}"
HOST="${RAG_HOST:-0.0.0.0}"
MODEL="${GEMINI_MODEL:-gemini-2.5-pro}"
STORE_NAME="${RAG_STORE_NAME:-default_store}"
CORS="${RAG_CORS_ORIGINS:-http://localhost:3000,http://localhost:${PORT}}"
ENABLE_API_DOCS="${ENABLE_API_DOCS:-true}"
UPLOAD_TIMEOUT="${UPLOAD_TIMEOUT:-180}"

# Get API key
if [ -z "${GEMINI_API_KEY:-}" ]; then
    echo "Enter your Google GEMINI_API_KEY (input hidden):"
    read -r -s GEMINI_API_KEY
    echo
fi
if [ -z "${GEMINI_API_KEY:-}" ]; then
    echo "Error: GEMINI_API_KEY is required"; exit 1
fi

# Prepare directories
mkdir -p "${SERVICES_DIR}"
cd "${SERVICES_DIR}"

# Clone or update
if [ ! -d "${SERVICE_NAME}" ]; then
    git clone --depth=1 "${REPO_URL}" "${SERVICE_NAME}"
else
    echo "Directory ${SERVICE_NAME} exists; attempting to update..."
    (cd "${SERVICE_NAME}" && git pull --ff-only || true)
fi

cd "${SERVICE_NAME}"

# Create venv and install
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# Generate .env
cat > .env <<EOF
GEMINI_API_KEY=${GEMINI_API_KEY}
HOST=${HOST}
PORT=${PORT}
MODEL=${MODEL}
STORE_NAME=${STORE_NAME}
STATE_FILE=store_state.json
CORS_ALLOW_ORIGINS=${CORS}
UPLOAD_TIMEOUT=${UPLOAD_TIMEOUT}
ENABLE_API_DOCS=${ENABLE_API_DOCS}
EOF

# Start service with Gunicorn (assumes Flask app exposed as app:app)
if lsof -iTCP:"${PORT}" -sTCP:LISTEN -Pn >/dev/null 2>&1; then
    echo "Port ${PORT} is already in use. Skipping start."
else
    nohup gunicorn -w 2 -k gthread -b "${HOST}:${PORT}" app:app --timeout 180 > rag.out 2>&1 &
    echo $! > rag.pid
    echo "Started Gemini RAG on http://localhost:${PORT} (PID $(cat rag.pid))"
fi

echo
echo "Done. Next steps:"
echo "- UI/API Docs:   http://localhost:${PORT}"
echo "- Status check:  curl http://localhost:${PORT}/status"
echo "- Stop service:  kill \$(cat services/${SERVICE_NAME}/rag.pid) || pkill -f 'gunicorn.*app:app.*:${PORT}'"
