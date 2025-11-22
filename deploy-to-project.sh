#!/bin/bash

echo "🚀 Deploying to Railway Project: 3d352986-ad31-4eee-a7f3-aabe20f99fc8"
echo "==============================================================="

# Try to link using different methods
echo "Attempting to link to project..."

# Method 1: Try direct link with project ID
echo "Method 1: Direct project link..."
printf "3d352986-ad31-4eee-a7f3-aabe20f99fc8\n" | railway link --project 3d352986-ad31-4eee-a7f3-aabe20f99fc8 2>/dev/null || echo "Direct link failed"

# Method 2: Try without interactive prompts
echo "Method 2: Non-interactive link..."
echo "3d352986-ad31-4eee-a7f3-aabe20f99fc8" | railway link 2>/dev/null || echo "Non-interactive link failed"

# Check if linked
echo "Checking project status..."
railway status

# If still not linked, try to deploy anyway
if [ $? -ne 0 ]; then
    echo "Still not linked. Trying alternative approach..."
    
    # Create a temporary railway config
    mkdir -p .railway
    cat > .railway/config.json << EOF
{
  "projectId": "3d352986-ad31-4eee-a7f3-aabe20f99fc8"
}
EOF
    
    echo "Created manual config. Trying deployment..."
    railway up
else
    echo "Project linked successfully! Deploying..."
    railway up
fi

echo "Getting deployment URL..."
railway domain