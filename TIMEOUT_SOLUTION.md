# Timeout Solution - Background Job Queue

## Problem

AI deck generation takes 1-2 minutes, but Vercel function timeouts:
- **Your current plan: 10-60 seconds max**
- **Required: 120+ seconds**

Current errors:
- 504 Gateway Timeout (function exceeded time limit)
- 500 errors (likely from timeout during AI calls)

## Solution Options

### Option 1: Upgrade Vercel Plan (Quickest)
**Cost**: $20/month (Pro) or $40/month (Pro+)

**Pros:**
- Immediate fix
- Pro gives 60 seconds (may still timeout)
- Pro+ gives 300 seconds (will work)

**Cons:**
- Monthly cost
- Pro plan may still be too short

**Action**: https://vercel.com/askchad/settings/billing

---

### Option 2: Background Job Queue (Free, but complex)
Use Inngest, Trigger.dev, or BullMQ to run generation in background.

**How it works:**
1. User submits form
2. API creates job and returns immediately
3. Job runs in background (no timeout)
4. Frontend polls for completion
5. Shows result when done

**Implementation time**: 2-3 hours
**Cost**: Free (Inngest free tier: 10k runs/month)

---

### Option 3: Reduce Generation Time (Partial fix)
Make AI calls faster by:
- Skip image generation (use placeholders)
- Use GPT-3.5 instead of Claude (faster but lower quality)
- Reduce number of phases

**Pros:**
- Free
- No architecture changes

**Cons:**
- Lower quality output
- May still timeout
- Defeats purpose of multi-phase system

---

### Option 4: Different Hosting Platform (Free)
Deploy to a platform with longer timeouts:

**Railway.app**:
- Free tier
- No timeout limits
- Easy migration

**Render.com**:
- Free tier
- 15-minute timeout
- Supports Node.js

**Google Cloud Run**:
- Free tier ($0-200/month)
- 60-minute timeout
- More complex setup

---

## Recommended Solution

**Short term (today)**:
Try Option 3 - Skip image generation temporarily to speed things up.

**Long term (this week)**:
Implement Option 2 - Background job queue with Inngest.

**If budget allows**:
Option 1 - Upgrade to Vercel Pro+ ($40/month).

---

## Quick Fix: Skip Image Generation

This will make generation much faster (20-30 seconds instead of 1-2 minutes):

```typescript
// In phase3_generateImages, skip actual image generation
export async function phase3_generateImages(
  apiKey: string,
  designOutput: Phase2DesignOutput
): Promise<Phase3ImageOutput> {
  // Return empty URLs - images will be placeholders
  return {
    slides: designOutput.slides.map(slide => ({
      slideNumber: slide.slideNumber,
      imageUrl: undefined, // No image generation
      fallbackUrl: undefined
    }))
  };
}
```

This lets you test the improved prompts and color/contrast fixes without timing out.

Would you like me to implement this quick fix?
