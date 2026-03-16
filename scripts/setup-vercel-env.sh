#!/bin/bash
# Sets up Vercel environment variables with production values for Production
# and sandbox values for Preview/Development.
#
# Usage: bash scripts/setup-vercel-env.sh

set -euo pipefail

# Helper: remove an env var from a specific environment (silent if not found)
rm_env() {
  local key="$1" env="$2"
  vercel env rm "$key" "$env" -y 2>/dev/null || true
}

# Helper: add an env var to a specific environment
add_env() {
  local key="$1" value="$2" env="$3"
  printf '%s' "$value" | vercel env add "$key" "$env" --force 2>/dev/null
}

echo "=== Vercel Environment Variable Setup ==="
echo ""

# ─── Variables that need DIFFERENT values per environment ─────────────────

# For each of these, we remove the combined (all-env) entry,
# then re-add separately for production and preview/development.

SPLIT_VARS=(
  # Key | Production Value | Sandbox Value
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY|pk_live_Y2xlcmsuYXN0cmlxLmFpJA|pk_test_ZnVubnktY2FsZi00MC5jbGVyay5hY2NvdW50cy5kZXYk"
  "CLERK_SECRET_KEY|sk_live_FpS8kefzyL1DvgXhjnRq6ULk9QSOvdwInxCLkK0pzz|sk_test_i0JyDvTIXJm4hM75JOUonJskERTl77zusrBjOVp5DA"
  "CLERK_WEBHOOK_SIGNING_SECRET|whsec_IlsAszjJEYfhH363Jb50ohyICsbJzGD1|whsec_oheg5oMOROZINqpSaqCz94I+hbo2ONjb"
  "POLAR_ACCESS_TOKEN|polar_oat_OL3ZvKggD29HuE4NvUuK9gBGccoAFEcIFwYoZ2twkSP|polar_oat_p6iW8Qu4srWffx0lmiugrka1bFha0Kv7MGccP0oDUuQ"
  "POLAR_WEBHOOK_URL|https://astriq.ai|https://arlie-refluent-theda.ngrok-free.dev"
  "POLAR_WEBHOOK_SECRET|polar_whs_gQPx3AwmgQuGkLl7ke4i9KjRPYkc4A0YUYcwd2t2uCc|polar_whs_IPz7zw7BhjGQE4he7ohG97DVhKyFDva5jGggD0XqBY0"
  "POLAR_SERVER|production|sandbox"
  "POLAR_AI_METER_ID|5ec4ad49-effc-4b34-af08-29644c3c8604|6a9dbf72-6e8c-4ced-92e1-4a5cb7b15533"
  "POLAR_SYNC_METER_ID|76d13232-176d-4c8d-86ab-6dc1c32853d1|26671b2e-8818-4d89-9b4b-db4542d436a4"
  "NEXT_PUBLIC_POLAR_PRODUCT_FREE|355c57be-fae4-4926-bd93-27f6fc62f2f1|cf6c7ef0-5cf3-4c84-9c30-193839f5becf"
  "NEXT_PUBLIC_POLAR_PRODUCT_BASIC|386f4924-5d66-408e-93ae-6b5f8488cd6c|8533cb4e-fedb-44a2-95c8-749dbacf3752"
  "NEXT_PUBLIC_POLAR_PRODUCT_PRO|01ee85d6-bd28-4c12-817f-5116e9f997a6|f935963d-eefd-4d0b-882b-990678aaf2d5"
  "NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_STARTER|2e9cd8da-58c6-4809-8a09-fa578e5eb0da|0181d14e-46bd-4820-a6c4-10d68f9c6eca"
  "NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_VALUE|3aa56c9c-3c12-4b24-b568-073d015739fb|b750ba7e-64a1-48d8-b6ce-3646c42f8446"
  "NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_POWER|d60316bc-b662-4c94-8f62-63885e8ea135|ae4ede58-0335-439e-a086-213caebbd67a"
  "NEXT_PUBLIC_POLAR_PRODUCT_CREDIT_BULK|47f30022-2f1e-4f91-b162-df68992a57a8|43f416da-298e-4660-907f-55450e708c49"
  "NEXT_PUBLIC_APP_URL|https://astriq.ai|https://arlie-refluent-theda.ngrok-free.dev"
  "CRON_SECRET|d951138bc310cc6efbfb568e9beccb1d0365ce218d7b21f05d5ab00dd4cc012e|3fde5b336a871fc09b3229ce702cd1eea305fb473f65cd4ce821c15fb42f49e7"
)

echo "1. Splitting environment-specific variables..."
for entry in "${SPLIT_VARS[@]}"; do
  IFS='|' read -r key prod_val dev_val <<< "$entry"
  echo "   $key"
  # Remove from all environments
  rm_env "$key" production
  rm_env "$key" preview
  rm_env "$key" development
  # Add with environment-specific values
  add_env "$key" "$prod_val" production
  add_env "$key" "$dev_val" preview
  add_env "$key" "$dev_val" development
done

# ─── New variables that don't exist in Vercel yet ─────────────────────────
# These get production values for production, sandbox values for preview/dev

echo ""
echo "2. Adding new variables (not yet in Vercel)..."

NEW_SPLIT_VARS=(
  "NEXT_PUBLIC_POLAR_PRODUCT_AGENCY|3f2b63e9-d760-4566-99b3-86fb465e564f|cbe18a0f-b990-4ae7-ae74-322cdddb5cfc"
  "NEXT_PUBLIC_POLAR_PRODUCT_MCP|7678bb60-4513-448b-9178-72e96d2c3b7a|7678bb60-4513-448b-9178-72e96d2c3b7a"
  "NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_BASIC|82fa68db-a727-41c9-9988-04eeb13337d6|dadeffd0-07d8-4039-b947-18720cddee0c"
  "NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_PRO|1a56d221-3583-4973-83b4-dbd6e7437310|4ef15463-1ec0-466b-b8c9-d05107174b81"
  "NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_AGENCY|d30d1690-c231-4c66-9704-ff69497a24e0|de746a5f-b513-4778-934b-0d3d8b7c1d33"
  "NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_STARTER|0e7dcabc-c57d-45ac-9590-340a2ffabe30|acfd3f87-eb61-4472-8c9f-8a86ed38a57b"
  "NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_VALUE|524072e8-5f48-4932-bb87-3889ba434de0|eadd4b56-7b41-475c-8250-eb144b6796f0"
  "NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_POWER|a31a0799-0219-48ab-8be7-70764bf42429|ad524f5d-e9af-4d8d-b311-d3396a01403f"
  "NEXT_PUBLIC_POLAR_PRODUCT_AI_TOKEN_BULK|af6a2475-8f94-4709-a865-3225e5e7596a|d788f7e5-5644-4d00-bdc8-8627e220cde4"
)

for entry in "${NEW_SPLIT_VARS[@]}"; do
  IFS='|' read -r key prod_val dev_val <<< "$entry"
  echo "   $key"
  add_env "$key" "$prod_val" production
  add_env "$key" "$dev_val" preview
  add_env "$key" "$dev_val" development
done

# ─── New variables same across all environments ───────────────────────────

echo ""
echo "3. Adding new shared variables..."

SHARED_VARS=(
  "AI_MODEL|anthropic/claude-haiku-4-5"
  "ELEVENLABS_API_KEY|9391ba4e05c37ae6d2d2fd036934e5c4c6e8f7eb9510c304ee3c6367064217ff"
  "ELEVENLABS_VOICE_ID|VCgLBmBjldJmfphyB8sZ"
  "COMMENT_ENRICHMENT_ENABLED|true"
)

for entry in "${SHARED_VARS[@]}"; do
  IFS='|' read -r key value <<< "$entry"
  echo "   $key"
  add_env "$key" "$value" production
  add_env "$key" "$value" preview
  add_env "$key" "$value" development
done

# CONNECTOR_ENCRYPTION_KEY needs different values per environment
echo "   CONNECTOR_ENCRYPTION_KEY"
add_env "CONNECTOR_ENCRYPTION_KEY" "b0264082113df8ca816c2defd92508a5d8982d157370ac9bd7c538b6efcbef30" production
add_env "CONNECTOR_ENCRYPTION_KEY" "117e8a91b8d83a7499adb77081f98d965974fd573ff69d37e751b2901299b303" preview
add_env "CONNECTOR_ENCRYPTION_KEY" "117e8a91b8d83a7499adb77081f98d965974fd573ff69d37e751b2901299b303" development

echo ""
echo "=== Done! ==="
echo ""
echo "Next: deploy to production with 'vercel --prod' or push to main"
