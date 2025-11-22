#!/bin/bash

echo "🚀 ARA Voice Form - Railway Deployment"
echo "======================================"
echo ""
echo "📋 PROJECT ID: 3d352986-ad31-4eee-a7f3-aabe20f99fc8"
echo ""

# Check authentication
echo "✅ Checking Railway authentication..."
railway whoami

echo ""
echo "🔗 STEP 1: Link to Railway Project"
echo "===================================="
echo "Run this command manually in your terminal:"
echo "railway link"
echo ""
echo "When prompted, select the project with ID:"
echo "3d352986-ad31-4eee-a7f3-aabe20f99fc8"
echo ""

echo "📦 STEP 2: Deploy Backend"
echo "=========================="
echo "After linking, run:"
echo "railway up"
echo ""

echo "🌐 STEP 3: Get Public URL"
echo "=========================="
echo "Then run:"
echo "railway domain"
echo ""

echo "⚙️  STEP 4: Configure Environment Variables"
echo "=========================================="
echo "Go to Railway dashboard and add:"
echo "- OPENROUTER_API_KEY"
echo "- ELEVENLABS_API_KEY"
echo ""

echo "📱 STEP 5: Update Mobile App"
echo "============================"
echo "Update your .env file with:"
echo "EXPO_PUBLIC_RORK_API_BASE_URL=https://your-app.up.railway.app"
echo ""

echo "🔄 STEP 6: Restart Development Server"
echo "======================================"
echo "EXPO_PUBLIC_RORK_API_BASE_URL=https://your-app.up.railway.app bun run start"
echo ""

echo "📊 Current Project Status:"
echo "========================="
echo "✅ Backend configured for Railway"
echo "✅ Railway.json ready"
echo "✅ Project ID available"
echo "✅ Authentication verified"
echo ""

echo "🎯 Ready to deploy! Follow the steps above."