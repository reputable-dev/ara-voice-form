# Gemini RAG Integration

Google Gemini-powered Retrieval-Augmented Generation service for file search and knowledge base querying.

## Overview

This service provides a REST API for uploading files, indexing them with Google Gemini, and querying the knowledge base using natural language.

**Based on:** [promptadvisers/gemini-rag-file-search](https://github.com/promptadvisers/gemini-rag-file-search)

## Quick Start

### Option 1: Bash Integration Script (Recommended for Development)

```bash
# From project root
./integrate_gemini_rag.sh

# Service will start on http://localhost:5001
```

The script will:
1. Clone the gemini-rag-file-search repository
2. Create Python virtual environment
3. Install dependencies
4. Generate `.env` configuration
5. Start the service with Gunicorn

### Option 2: Docker Deployment (Recommended for Production)

```bash
# Build and start service
docker-compose up -d gemini-rag

# Check logs
docker-compose logs -f gemini-rag

# Stop service
docker-compose down
```

## Configuration

### Environment Variables

Create `.env` file in `services/gemini_rag/`:

```bash
# Required
GEMINI_API_KEY=your_google_gemini_api_key

# Optional (defaults shown)
HOST=0.0.0.0
PORT=5001
MODEL=gemini-2.5-pro
STORE_NAME=default_store
STATE_FILE=store_state.json
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:5001
UPLOAD_TIMEOUT=180
ENABLE_API_DOCS=true
```

Get your Gemini API key: https://aistudio.google.com/app/apikey

## API Endpoints

### Upload File
```bash
POST /upload
Content-Type: multipart/form-data

file: <file>
store_name: <optional>

Response:
{
  "message": "File uploaded successfully",
  "store_name": "default_store"
}
```

### Query RAG
```bash
GET /query?question=<question>&store_name=<optional>&max_results=<optional>

Response:
{
  "answer": "Your answer here",
  "sources": [...],
  "store_name": "default_store"
}
```

### List Files
```bash
GET /files?store_name=<optional>

Response:
{
  "files": ["file1.pdf", "file2.txt"],
  "store_name": "default_store"
}
```

### Delete File
```bash
DELETE /delete?file_name=<name>&store_name=<optional>

Response:
{
  "message": "File deleted successfully"
}
```

### Clear Store
```bash
POST /clear?store_name=<optional>

Response:
{
  "message": "Store cleared",
  "store_name": "default_store"
}
```

### Health Check
```bash
GET /status

Response:
{
  "status": "ok",
  "message": "RAG service is running"
}
```

## React Native Integration

The service is integrated with the React Native app through Convex backend functions.

### Using React Hooks

```typescript
import { useQueryRag, useListRagFiles, useRagStatus } from '@/lib/gemini-rag';

function MyComponent() {
  // Query the RAG
  const { query } = useQueryRag();
  const handleQuery = async () => {
    const result = await query("What is in this document?", "my_store");
    console.log(result.answer);
  };

  // List files
  const { files, totalFiles, isOnline } = useListRagFiles("my_store");

  // Check status
  const { status, isOnline, message } = useRagStatus();

  return (
    <View>
      <Text>Status: {status}</Text>
      <Text>Files: {totalFiles}</Text>
    </View>
  );
}
```

### Demo Screen

See `app/(tabs)/rag-demo.tsx` for a complete working example.

## Troubleshooting

### Service Not Starting

```bash
# Check if port 5001 is in use
lsof -i :5001

# Kill existing process
kill $(lsof -t -i :5001)

# Restart service
./integrate_gemini_rag.sh
```

### Connection Refused from React Native

Make sure:
1. RAG service is running: `curl http://localhost:5001/status`
2. `RAG_SERVICE_URL` is set correctly in `.env`
3. CORS is configured to allow your origin

### Docker Issues

```bash
# Rebuild container
docker-compose build --no-cache gemini-rag

# Check container logs
docker-compose logs -f gemini-rag

# Restart service
docker-compose restart gemini-rag
```

## Development

### Manual Setup

```bash
cd services/gemini_rag

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn

# Start service
gunicorn -w 2 -k gthread -b 0.0.0.0:5001 app:app --timeout 180
```

### Logs

**Bash Integration:**
- Service output: `services/gemini_rag/rag.out`
- Process ID: `services/gemini_rag/rag.pid`

**Docker:**
```bash
docker-compose logs -f gemini-rag
```

## Production Deployment

For production, use Docker with proper environment variables:

```yaml
# docker-compose.production.yml
services:
  gemini-rag:
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - HOST=0.0.0.0
      - PORT=5001
      - MODEL=gemini-2.5-pro
      - ENABLE_API_DOCS=false  # Disable in production
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/status"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Security

- **API Key Protection:** Never commit `.env` files with API keys
- **CORS Configuration:** Restrict `CORS_ALLOW_ORIGINS` to your domains
- **API Docs:** Disable `ENABLE_API_DOCS` in production
- **File Uploads:** Implement file size and type restrictions
- **Rate Limiting:** Add rate limiting in production

## License

Same as main ARA Voice Form project (MIT)

## Support

- Main Project: [ara-voice-form](../..)
- Upstream: [gemini-rag-file-search](https://github.com/promptadvisers/gemini-rag-file-search)
- Gemini API: https://ai.google.dev/docs
