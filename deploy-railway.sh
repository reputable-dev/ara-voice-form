#!/bin/bash

echo "🚀 Deploying ARA Voice Form Backend to Railway"
echo "=============================================="

# Step 1: Login (if needed)
echo "Step 1: Checking Railway authentication..."
railway whoami || {
    echo "Please run: railway login"
    exit 1
}

# Step 2: Initialize project
echo "Step 2: Creating new Railway project..."
echo "When prompted, choose 'Create new project' and name it 'ara-voice-form-backend'"
railway init

# Step 3: Deploy
echo "Step 3: Deploying backend to Railway..."
railway up

# Step 4: Get domain
echo "Step 4: Getting Railway domain..."
RAILWAY_URL=$(railway domain)
echo "✅ Your backend is deployed at: $RAILWAY_URL"

# Step 5: Update environment
echo "Step 5: Updating your app configuration..."
echo "Add this to your .env file:"
echo "EXPO_PUBLIC_RORK_API_BASE_URL=$RAILWAY_URL"

# Step 6: Instructions for environment variables
echo ""
echo "📋 Next Steps:"
echo "1. Go to your Railway dashboard: railway open"
echo "2. Click on your service → Variables"
echo "3. Add these environment variables:"
echo "   - OPENROUTER_API_KEY=your_openrouter_api_key"
echo "   - ELEVENLABS_API_KEY=your_elevenlabs_api_key"
echo ""
echo "4. Restart your development server with the new URL:"
echo "   EXPO_PUBLIC_RORK_API_BASE_URL=$RAILWAY_URL bun run start"
echo ""
echo "✅ Deployment complete!"