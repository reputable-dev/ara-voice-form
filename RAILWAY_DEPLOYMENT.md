# Railway Deployment Guide

## Backend Deployment

Your backend is now ready for Railway deployment! The project includes:

- **Hono server** with tRPC integration
- **OpenRouter API proxy** for secure AI calls
- **Railway configuration** files ready

### Deploy Steps:

1. **Login to Railway**:
   ```bash
   railway login
   ```

2. **Initialize Railway project**:
   ```bash
   railway init
   ```

3. **Deploy to Railway**:
   ```bash
   railway up
   ```

4. **Set environment variables** in Railway dashboard:
   - `OPENROUTER_API_KEY` - Your OpenRouter API key
   - `OPENROUTER_HTTP_REFERER` - Optional, for API rankings
   - `OPENROUTER_X_TITLE` - Optional, for API rankings

5. **Get your Railway URL**:
   ```bash
   railway domain
   # This will give you something like: https://your-app.up.railway.app
   ```

## Frontend Environment Setup

1. **Update your `.env` file** with the Railway URL:
   ```bash
   EXPO_PUBLIC_API_BASE_URL=https://your-app.up.railway.app
   ```

2. **For production builds**, update `eas.json`:
   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_API_BASE_URL": "https://your-app.up.railway.app"
         }
       }
     }
   }
   ```

## Build and Deploy

1. **Build for production**:
   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```

2. **Submit to app stores**:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Testing

1. **Test locally first**:
   ```bash
   EXPO_PUBLIC_API_BASE_URL=https://your-app.up.railway.app bun run start-web
   ```

2. **Verify the connection** by checking that API calls work in the browser console.

## Notes

- Make sure your Railway backend has CORS configured to allow your app's domain
- The backend should be running on Railway's default port (usually 3000 or whatever your app uses)
- Environment variables on Railway can be set in the Railway dashboard under "Variables"