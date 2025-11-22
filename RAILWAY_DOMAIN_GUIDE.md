# Railway Domain Setup Guide

## Quick Setup Commands

### 1. Link Project (if not already linked)
```bash
railway link
# Select: danmarauda's Projects
# Find: 3d352986-ad31-4eee-a7f3-aabe20f99fc8
```

### 2. Generate Railway Domain
```bash
railway domain
```
*This creates a free Railway subdomain like:*
`https://ara-voice-form-backend.up.railway.app`

### 3. Deploy with Domain
```bash
railway up
```

## Domain Options

### Railway-Provided Domain (Free)
- Automatic SSL certificate
- Random subdomain name
- Always available
- No DNS configuration needed

### Custom Domain (Optional)
```bash
railway domain yourdomain.com
```
- Requires DNS configuration
- Automatic SSL certificate
- Professional appearance
- Brand consistency

## Domain Management Commands

### View Current Domains
```bash
railway domain --list
```

### Service-Specific Domain
```bash
railway domain --service backend
```

### JSON Output
```bash
railway domain --json
```

## After Domain Setup

### 1. Update Environment Variables
```bash
# Add to .env file
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-domain.up.railway.app
```

### 2. Restart Development Server
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-domain.up.railway.app bun run start
```

### 3. Test Connection
```bash
curl https://your-domain.up.railway.app/
```

## Production Configuration

### Update eas.json for Production Builds
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_RORK_API_BASE_URL": "https://your-domain.up.railway.app"
      }
    }
  }
}
```

## Environment Variables on Railway

Don't forget to set these in Railway dashboard:
- `OPENROUTER_API_KEY`
- `ELEVENLABS_API_KEY`

## URL Examples

Railway domains follow this pattern:
- `https://[project-name].up.railway.app`
- `https://[random-string].up.railway.app`

Your backend will be accessible at the Railway domain once deployed!