# Vercel Function Timeout Configuration

## Current Issue

The AI deck generation process takes 1-2 minutes but the API was timing out at 60 seconds (504 Gateway Timeout error).

## Changes Made

1. **Increased API timeout to 300 seconds (5 minutes)**
   - `app/api/ai/generate-deck/route.ts`: Set `maxDuration = 300`
   - `vercel.json`: Set `maxDuration: 300` for the generate-deck function

2. **Fixed error handling**
   - Fixed "body stream already read" error in `/app/create-ai/page.tsx`
   - Now reads response.text() once and parses it as needed

## Vercel Plan Requirements

⚠️ **IMPORTANT**: The increased timeout requires a **Vercel Pro plan or higher**.

### Vercel Function Duration Limits by Plan:

| Plan | Max Duration |
|------|-------------|
| Hobby (Free) | 10 seconds |
| Pro | 60 seconds |
| **Pro+ / Enterprise** | **300 seconds (5 minutes)** |

Source: https://vercel.com/docs/functions/serverless-functions/runtimes#max-duration

## Current Status

The code is configured for 300-second timeout, but this will only work if your Vercel account is on **Pro+ or Enterprise plan**.

### If you're on Hobby/Free plan:

The function will still timeout at 10 seconds. You'll see 504 errors for AI generation.

**Solution options:**

1. **Upgrade to Vercel Pro+ plan** (Recommended for production)
   - Go to: https://vercel.com/askchad/pitch-deck/settings/billing
   - Upgrade to Pro+ or Enterprise plan
   - Redeploy (automatic after git push)

2. **Use a different deployment platform** that allows longer timeouts:
   - Railway.app (no timeout limits)
   - Render.com (no timeout limits)
   - AWS Lambda (15 minutes max)
   - Google Cloud Run (60 minutes max)

3. **Implement async job queue** (More complex):
   - Move AI generation to a background worker
   - Use a queue system (BullMQ, Inngest, etc.)
   - Poll for completion from the frontend
   - This works on any Vercel plan but requires more infrastructure

### If you're on Pro plan:

The function will timeout at 60 seconds (not enough for the 1-2 minute generation process).

You need to upgrade to **Pro+ or Enterprise** for 300-second timeout.

## Testing

After the deployment completes, test the file upload at:
https://pitch-deck-kappa.vercel.app/create-ai

If you still get 504 errors after ~10 seconds or ~60 seconds, your Vercel plan doesn't support the longer timeout.

## File Upload Success

✅ The file upload to Supabase Storage is working correctly (13MB PDF uploaded successfully).

The issue is only with the AI generation timeout, not with file uploads.
