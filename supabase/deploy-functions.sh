#!/bin/bash

export SUPABASE_ACCESS_TOKEN='sbp_69cda75072bd09dd6efe32944cbadd95b4f1ae4e'
export SUPABASE_PROJECT_ID='ggpjulailsggugazzrsb'

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN is not set"
  echo "Please set it using: export SUPABASE_ACCESS_TOKEN='your-access-token'"
  exit 1
fi

# Check if SUPABASE_PROJECT_ID is set
if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "Error: SUPABASE_PROJECT_ID is not set"
  echo "Please set it using: export SUPABASE_PROJECT_ID='your-project-id'"
  exit 1
fi

# Deploy all functions
echo "Deploying Edge Functions..."

# Deploy send-game-invite function
echo "Deploying send-game-invite function..."
supabase functions deploy send-game-invite \
  --project-ref $SUPABASE_PROJECT_ID \
  --no-verify-jwt

echo "Deployment complete!" 