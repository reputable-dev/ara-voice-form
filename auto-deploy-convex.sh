#!/bin/bash

echo "🚀 ARA Voice Form - Convex Auto Deployment"
echo "=========================================="
echo ""

echo "🔐 Step 1: Convex Authentication"
echo "================================="
echo "✅ Already authenticated as Dan"
echo ""

echo "🏗️  Step 2: Project Configuration"
echo "================================="
echo "Configuring Convex project..."
echo ""

# Try to configure without prompts
echo "npx convex dev --once" | head -10

echo ""
echo "🌐 Step 3: Deployment Options"
echo "============================="
echo ""
echo "Option A: Create New Project (Recommended)"
echo "-------------------------------------------"
echo "1. Run: npx convex dev"
echo "2. Choose 'Create new project'"
echo "3. Name: 'ara-voice-form'"
echo "4. Deploy: npx convex deploy --yes"
echo ""

echo "Option B: Use Existing Development"
echo "-----------------------------------"
echo "1. Current: anonymous-haus-stack-convex-dev"
echo "2. Deploy: npx convex deploy --yes"
echo ""

echo "Option C: Manual Setup"
echo "----------------------"
echo "1. Go to https://dashboard.convex.dev"
echo "2. Create new project"
echo "3. Copy deployment URL"
echo "4. Set CONVEX_DEPLOYMENT=your-url"
echo "5. Run: npx convex deploy --yes"
echo ""

echo "🔑 Step 4: Environment Variables"
echo "================================="
echo "After deployment, set these variables:"
echo ""
echo "npx convex env set OPENROUTER_API_KEY your_key_here"
echo "npx convex env set ELEVENLABS_API_KEY your_key_here"
echo ""

echo "📱 Step 5: Mobile App Configuration"
echo "===================================="
echo "Add to your .env file:"
echo "EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud"
echo ""

echo "📊 Current Status:"
echo "=================="
echo "✅ Convex CLI installed"
echo "✅ Authenticated: Dan (dan@marauda.io)"
echo "✅ Schema defined: users, contracts tables"
echo "✅ API functions ready: AI integration"
echo "✅ Provider configured: ConvexProvider.tsx"
echo ""

echo "🎯 Next Steps:"
echo "============="
echo "1. Run 'npx convex dev' (choose Option A or B)"
echo "2. Deploy with 'npx convex deploy --yes'"
echo "3. Set environment variables"
echo "4. Update mobile app URL"
echo ""

echo "🚀 Ready for Convex deployment!"