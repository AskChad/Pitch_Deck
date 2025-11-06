/**
 * Multi-Phase Deck Generation System
 *
 * Based on analysis of professional decks (AI Action Loop v8.pdf):
 * - Minimal text, maximum visual impact
 * - ONE message per slide
 * - Custom illustrations for every concept
 * - Bold typography, generous white space
 * - Professional color schemes
 */

export interface Phase1ContentOutput {
  deckTitle: string;
  deckDescription: string;
  slides: Array<{
    slideNumber: number;
    message: string; // ONE core message (5-8 words max)
    supportingText?: string; // Optional 1-2 sentences
    dataPoints?: string[]; // Stats/numbers if applicable
    slideIntent: 'title' | 'problem' | 'solution' | 'stats' | 'process' | 'comparison' | 'case-study' | 'cta';
  }>;
}

export interface Phase2DesignOutput {
  slides: Array<{
    slideNumber: number;
    layout: 'title' | 'image-focus' | 'split' | 'stats' | 'content';
    background: 'gradient' | 'solid' | 'pattern';
    visualStrategy: {
      type: 'illustration' | 'diagram' | 'chart' | 'infographic' | 'photo' | 'icon-set';
      description: string; // What should be visualized
      detailedPrompt: string; // VERY detailed prompt for image generation
      position: 'background' | 'center' | 'right' | 'left' | 'split';
      style: string; // "3D illustration", "flat design", "isometric", etc.
    };
    typography: {
      headline: string;
      headlineSize: 'huge' | 'large' | 'medium';
      subtext?: string;
      emphasizedNumbers?: string[]; // Big stats to highlight
    };
    colorScheme: {
      primary: string;
      accent: string;
      background: string;
    };
  }>;
}

export interface Phase3ImageOutput {
  slides: Array<{
    slideNumber: number;
    imageUrl?: string;
    fallbackUrl?: string;
  }>;
}

export interface FinalDeck {
  name: string;
  description: string;
  slides: any[];
  theme: any;
  logo?: string;
}

/**
 * Phase 1: Content Strategy
 * Pure content focus - no design decisions
 */
export async function phase1_generateContent(
  apiKey: string,
  userPrompt: string,
  referenceMaterials: string,
  instructions?: string
): Promise<Phase1ContentOutput> {

  const systemPrompt = `You are a presentation content strategist who creates compelling slide messaging.

CRITICAL RULES:
1. ONE message per slide - no more
2. Headlines must be 5-8 words maximum
3. Supporting text: 1-2 sentences max (or none)
4. Every slide answers: "What's the ONE thing the audience should remember?"
5. Use data/stats sparingly - only when they tell a powerful story
6. NO design decisions - just pure messaging

SLIDE INTENT TYPES:
- title: Opening slide with main value proposition
- problem: The pain/challenge (ONE specific problem)
- solution: How you solve it (ONE clear solution)
- stats: Big number that proves impact (ONE key metric)
- process: How it works (3-5 steps max)
- comparison: Before vs After (clear contrast)
- case-study: Real-world proof (ONE customer story)
- cta: What happens next (clear next step)

OUTPUT STRUCTURE:
Return ONLY JSON - no markdown, no explanation.`;

  const userPromptText = `
${instructions ? `CUSTOM INSTRUCTIONS:\n${instructions}\n\n` : ''}

${referenceMaterials ? `REFERENCE MATERIALS:\n${referenceMaterials}\n\n` : ''}

USER CONTENT:
${userPrompt}

Create a compelling deck structure with 8-12 slides. Each slide should have ONE clear message.

Return JSON in this exact format:
{
  "deckTitle": "Main Title",
  "deckDescription": "Brief description",
  "slides": [
    {
      "slideNumber": 1,
      "message": "One powerful statement (5-8 words)",
      "supportingText": "Optional 1-2 sentences of context",
      "dataPoints": ["stat 1", "stat 2"],
      "slideIntent": "title"
    }
  ]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPromptText }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Phase 1 failed: ${error}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Phase 1: No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Phase 2: Visual Design Strategy
 * Art director decides layouts, visuals, and graphic prompts
 */
export async function phase2_designSlides(
  apiKey: string,
  contentOutput: Phase1ContentOutput,
  brandColors?: { primary: string; secondary: string; accent: string }
): Promise<Phase2DesignOutput> {

  const systemPrompt = `You are a presentation visual designer and art director.

YOUR MISSION: Transform content into visually stunning slides.

DESIGN PRINCIPLES (based on professional decks):
1. Visuals tell the story - text supports
2. Every slide needs a compelling graphic
3. Use metaphors: "leaky bucket" for lost revenue, "maze" for complexity, "rocket" for growth
4. Big, bold typography for key messages
5. Generous white space
6. ONE visual focus per slide

LAYOUT RULES:
- "image-focus": Large central visual (60%+ of slide) - USE THIS MOST!
- "split": Text left, large visual right (or vice versa)
- "stats": HUGE number (12rem font) with minimal text
- "title": Centered text with subtle background graphic
- "content": AVOID unless absolutely necessary

VISUAL STRATEGY:
For EVERY slide, you must decide what to visualize:
- Problem? → Create a visual metaphor (leaky bucket, tangled wires, etc.)
- Process? → Flow diagram with icons and arrows
- Stats? → Bold number with supporting icons
- Comparison? → Side-by-side visual or pie chart
- Solution? → Clean, organized visual showing the fix

GRAPHIC PROMPT RULES:
Be EXTREMELY detailed. Bad prompt: "rocket ship"
Good prompt: "3D rendered rocket ship in vibrant blue and white, launching upward against a gradient blue background, with glowing orange flame trail, modern minimalist style, viewed from 45-degree angle, cinematic lighting"

BACKGROUND RULES:
- gradient: Use for 60% of slides (impactful, professional)
- pattern: Use for 30% (subtle, sophisticated)
- solid: Use sparingly (10%)

OUTPUT: Return pure JSON with complete design specs for each slide.`;

  const slides = contentOutput.slides.map(slide => ({
    slideNumber: slide.slideNumber,
    message: slide.message,
    supportingText: slide.supportingText,
    dataPoints: slide.dataPoints,
    slideIntent: slide.slideIntent,
  }));

  const userPromptText = `
Design these slides with professional, visually compelling layouts:

${JSON.stringify(slides, null, 2)}

${brandColors ? `\nBRAND COLORS:\nPrimary: ${brandColors.primary}\nSecondary: ${brandColors.secondary}\nAccent: ${brandColors.accent}\n` : ''}

For EACH slide, provide:
1. Layout type (prioritize image-focus and split)
2. Background type (mostly gradient/pattern)
3. Detailed visual strategy with VERY specific image generation prompt
4. Typography specifications
5. Color scheme

Return JSON in this exact format:
{
  "slides": [
    {
      "slideNumber": 1,
      "layout": "image-focus",
      "background": "gradient",
      "visualStrategy": {
        "type": "illustration",
        "description": "What this visual represents",
        "detailedPrompt": "EXTREMELY detailed prompt for AI image generation - be very specific about style, colors, composition, lighting, angle",
        "position": "center",
        "style": "3D illustration with modern minimalist aesthetic"
      },
      "typography": {
        "headline": "The main message",
        "headlineSize": "huge",
        "subtext": "Optional supporting text",
        "emphasizedNumbers": ["95%", "10x"]
      },
      "colorScheme": {
        "primary": "#2563eb",
        "accent": "#f59e0b",
        "background": "#ffffff"
      }
    }
  ]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPromptText }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Phase 2 failed: ${error}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Phase 2: No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Phase 3: Generate Images
 * Uses Leonardo.ai to create actual graphics
 */
export async function phase3_generateImages(
  leonardoApiKey: string,
  designOutput: Phase2DesignOutput
): Promise<Phase3ImageOutput> {

  const { generateImages } = await import('./leonardo');

  // Collect all image prompts
  const prompts = designOutput.slides
    .filter(slide => slide.visualStrategy?.detailedPrompt)
    .map(slide => slide.visualStrategy.detailedPrompt);

  console.log(`Phase 3: Generating ${prompts.length} images with Leonardo.ai...`);

  const images = await generateImages(leonardoApiKey, prompts);

  // Map images back to slides
  const results: Phase3ImageOutput = {
    slides: designOutput.slides.map((slide, index) => ({
      slideNumber: slide.slideNumber,
      imageUrl: images[index]?.url || undefined,
    })),
  };

  return results;
}

/**
 * Phase 4: Assemble Final Deck
 * Combines content, design, and images into final structure
 */
export function phase4_assembleDeck(
  contentOutput: Phase1ContentOutput,
  designOutput: Phase2DesignOutput,
  imageOutput: Phase3ImageOutput,
  brandColors?: { primary: string; secondary: string; accent: string }
): FinalDeck {

  const slides = contentOutput.slides.map((content, index) => {
    const design = designOutput.slides[index];
    const image = imageOutput.slides[index];

    // Map to our slide structure
    let slideType = design.layout;
    let slideData: any = {
      id: `slide-${Date.now()}-${index}`,
      type: slideType,
      background: design.background,
      title: design.typography.headline,
    };

    // Add content based on layout
    if (slideType === 'title') {
      slideData.subtitle = design.typography.subtext;
    } else if (slideType === 'stats' && design.typography.emphasizedNumbers?.[0]) {
      slideData.mainStat = design.typography.emphasizedNumbers[0];
      slideData.statLabel = design.typography.headline;
      slideData.supportingStats = design.typography.emphasizedNumbers.slice(1).join(' • ');
    } else if (slideType === 'split') {
      slideData.leftContent = content.supportingText || content.message;
      slideData.layout = '50-50';
    } else if (slideType === 'content') {
      slideData.content = content.dataPoints?.map(d => `• ${d}`).join('\n') || content.supportingText;
    }

    // Add image if available
    if (image.imageUrl) {
      slideData.imageUrl = image.imageUrl;
    }

    // Add graphic metadata
    if (design.visualStrategy) {
      slideData.graphic = {
        type: design.visualStrategy.type === 'icon-set' ? 'icon' : 'image',
        prompt: design.visualStrategy.detailedPrompt,
        position: design.visualStrategy.position,
      };
    }

    return slideData;
  });

  const theme = {
    colors: brandColors || {
      primary: designOutput.slides[0].colorScheme.primary,
      secondary: '#7c3aed',
      accent: designOutput.slides[0].colorScheme.accent,
      background: '#ffffff',
      text: '#1f2937',
    },
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  return {
    name: contentOutput.deckTitle,
    description: contentOutput.deckDescription,
    slides,
    theme,
  };
}
