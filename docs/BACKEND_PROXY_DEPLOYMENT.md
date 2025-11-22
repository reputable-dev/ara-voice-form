# Backend Proxy Deployment Guide

## Overview

The Gemini API proxy (`backend/api/gemini-proxy.ts`) moves API key handling to the server-side for security. This guide covers deployment to common backend platforms.

## Security Benefits

✅ **API keys never exposed in client code**
✅ **Rate limiting implemented server-side**
✅ **Request validation and sanitization**
✅ **Error handling without leaking internal details**

---

## Deployment Options

### Option 1: Vercel Serverless Function (Recommended for Next.js)

**1. Copy proxy to Vercel API routes:**
```bash
mkdir -p api
cp backend/api/gemini-proxy.ts api/gemini-proxy.ts
```

**2. Update imports for Vercel:**
```typescript
// Change this:
import { Request, Response } from 'express';

// To this:
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Update function signature:
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    return POST(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
```

**3. Set environment variable in Vercel:**
```bash
vercel env add GEMINI_API_KEY production
# Paste your API key when prompted
```

**4. Deploy:**
```bash
vercel --prod
```

**5. Update client .env:**
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-app.vercel.app
```

---

### Option 2: Express.js Backend

**1. Install dependencies:**
```bash
cd backend
npm install express cors dotenv
npm install -D @types/express @types/cors
```

**2. Create Express server:**
```typescript
// backend/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { POST as geminiProxy } from './api/gemini-proxy';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Gemini proxy endpoint
app.post('/api/gemini-proxy', geminiProxy);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
```

**3. Create .env file:**
```bash
GEMINI_API_KEY=your_actual_gemini_api_key
PORT=3000
```

**4. Start server:**
```bash
npm run dev  # Development
npm start    # Production
```

---

### Option 3: Firebase Cloud Functions

**1. Initialize Firebase:**
```bash
firebase init functions
```

**2. Create function:**
```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import { POST as geminiProxy } from './api/gemini-proxy';

export const geminiProxyFunction = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  return geminiProxy(req, res);
});
```

**3. Set environment variable:**
```bash
firebase functions:config:set gemini.api_key="your_api_key"
```

**4. Deploy:**
```bash
firebase deploy --only functions
```

---

### Option 4: AWS Lambda (with API Gateway)

**1. Install Serverless Framework:**
```bash
npm install -g serverless
serverless create --template aws-nodejs-typescript --path backend
```

**2. Create handler:**
```typescript
// handler.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { POST as geminiProxy } from './api/gemini-proxy';

export const geminiProxyHandler: APIGatewayProxyHandler = async (event) => {
  const req = {
    method: event.httpMethod,
    body: JSON.parse(event.body || '{}'),
  };

  const res = {
    status: (code: number) => ({ json: (data: any) => ({ statusCode: code, body: JSON.stringify(data) }) }),
  };

  return geminiProxy(req as any, res as any);
};
```

**3. Configure serverless.yml:**
```yaml
functions:
  geminiProxy:
    handler: handler.geminiProxyHandler
    events:
      - http:
          path: api/gemini-proxy
          method: post
          cors: true
    environment:
      GEMINI_API_KEY: ${env:GEMINI_API_KEY}
```

**4. Deploy:**
```bash
serverless deploy
```

---

## Environment Variables Setup

**Required on backend server:**
```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Required in Expo app:**
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend-url.com
```

---

## Testing the Proxy

**1. Test with curl:**
```bash
curl -X POST https://your-backend-url.com/api/gemini-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Extract name from: John Doe lives at 123 Main St",
    "generationConfig": {
      "temperature": 0.1,
      "maxOutputTokens": 1024
    }
  }'
```

**Expected response:**
```json
{
  "success": true,
  "response": "{\"name\":\"John Doe\",\"address\":\"123 Main St\"}",
  "model": "gemini-2.0-flash-exp"
}
```

**2. Test from mobile app:**
- Update `.env` with backend URL
- Restart Metro bundler: `npx expo start --clear`
- Test voice transcription feature
- Check Network tab in React Native Debugger

---

## Rate Limiting (Recommended)

Add rate limiting to prevent abuse:

**Express.js example:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests from this IP'
});

app.post('/api/gemini-proxy', limiter, geminiProxy);
```

---

## Monitoring

**Add logging:**
```typescript
// In gemini-proxy.ts
console.log('[Gemini Proxy] Request received:', {
  timestamp: new Date().toISOString(),
  promptLength: prompt.length,
  ipAddress: req.ip,
});
```

**Use Sentry for error tracking:**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// In catch block:
Sentry.captureException(error);
```

---

## Security Checklist

- [ ] API key stored in environment variables (not in code)
- [ ] CORS configured to allow only your app domain
- [ ] Rate limiting enabled
- [ ] Request validation implemented
- [ ] Error messages don't expose internal details
- [ ] HTTPS enabled in production
- [ ] Monitoring and logging configured

---

## Troubleshooting

**Error: "GEMINI_API_KEY not configured"**
- Check environment variable is set on server
- Restart server after setting env vars
- Verify .env file is being loaded (dotenv)

**Error: "CORS policy blocked"**
- Add CORS middleware on backend
- Allow your app's domain in CORS config
- Check preflight OPTIONS requests

**Error: 429 Too Many Requests**
- Implement rate limiting
- Check Gemini API quota limits
- Add caching for repeated requests

---

## Next Steps

1. Choose deployment platform above
2. Deploy proxy endpoint
3. Set `GEMINI_API_KEY` environment variable
4. Update `EXPO_PUBLIC_RORK_API_BASE_URL` in app
5. Test with curl and mobile app
6. Enable monitoring and rate limiting
7. Monitor logs for errors
