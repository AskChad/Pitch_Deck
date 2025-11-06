import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateImages as generateLeonardoImages } from '@/lib/ai/leonardo';
import { generateIcons } from '@/lib/ai/iconkit';
import { extractBrandAssets } from '@/lib/ai/brand-extractor';
import {
  phase1_generateContent,
  phase2_designSlides,
  phase3_generateImages,
  phase4_assembleDeck,
} from '@/lib/ai/multi-phase-generator';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const content = formData.get('content') as string;
    const instructions = formData.get('instructions') as string;
    const buildOnly = formData.get('buildOnly') === 'true';
    const fillMissingGraphics = formData.get('fillMissingGraphics') === 'true';
    const useMultiPhase = formData.get('useMultiPhase') === 'true';
    const urlsJson = formData.get('urls') as string;
    const urls = urlsJson ? JSON.parse(urlsJson) : [];
    const files = formData.getAll('files') as File[];

    // Get API keys from settings
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['claude_api_key', 'claude_system_prompt', 'leonardo_api_key', 'iconkit_api_key']);

    const claudeApiKey = settings?.find(s => s.key === 'claude_api_key')?.value;
    const leonardoApiKey = settings?.find(s => s.key === 'leonardo_api_key')?.value;
    const iconkitApiKey = settings?.find(s => s.key === 'iconkit_api_key')?.value;

    // Use different system prompt based on mode
    let systemPrompt: string;

    if (buildOnly && fillMissingGraphics) {
      systemPrompt = `You are a precise pitch deck builder with visual enhancement capabilities.

STRICT RULES FOR CONTENT:
- Use ONLY the exact content provided by the user
- Follow their exact structure and layout specifications
- Do NOT add, remove, or reorganize content
- Do NOT suggest improvements to their text or structure

GRAPHICS ENHANCEMENT:
- For slides WHERE the user HAS specified graphics/images: Use their exact descriptions
- For slides WHERE the user has NOT specified graphics/images: Suggest appropriate visual elements (charts, diagrams, icons, images)
- Analyze each slide's content and suggest visuals that enhance the message
- Recommend specific visualization types where applicable (bar chart, line graph, pie chart, icon, illustration, etc.)

GRAPHICS OUTPUT FORMAT:
- For each slide that needs a graphic, include a "graphic" field with:
  - type: "image" (complex graphics like charts, diagrams, illustrations) or "icon" (simple icons)
  - prompt: Detailed description for AI generation (e.g., "A 3D leaky bucket with water dripping out, symbolizing customer churn")
  - position: "background", "center", "side", or "inline"
- Images will be generated with Leonardo.ai (high-quality illustrations, charts, diagrams)
- Icons will be generated with IconKit.ai (simple, clean icons)`;
    } else if (buildOnly) {
      systemPrompt = `You are a precise pitch deck builder. Your role is to convert user specifications into structured slide decks WITHOUT adding any creative interpretation.

STRICT RULES:
- Use ONLY the exact content provided by the user
- Follow their exact structure and layout specifications
- Use their exact image descriptions without modification
- Do NOT add, remove, or reorganize content
- Do NOT suggest improvements or alternatives
- Act as a pure conversion tool from user specs to JSON format

GRAPHICS OUTPUT FORMAT:
- For each slide that needs a graphic, include a "graphic" field with:
  - type: "image" (complex graphics like charts, diagrams, illustrations) or "icon" (simple icons)
  - prompt: Detailed description for AI generation from user's specifications
  - position: "background", "center", "side", or "inline"
- Images will be generated with Leonardo.ai (high-quality illustrations, charts, diagrams)
- Icons will be generated with IconKit.ai (simple, clean icons)`;
    } else {
      systemPrompt = settings?.find(s => s.key === 'claude_system_prompt')?.value ||
      `You are an expert pitch deck creator and visual designer.

PRIORITY ORDER (MOST IMPORTANT FIRST):
1. USE ALL REFERENCE MATERIALS PROVIDED - Extract and incorporate information from URLs, documents, and user content
2. FOLLOW USER INSTRUCTIONS - Honor custom instructions and requirements exactly
3. CREATE VISUAL STORYTELLING - Prioritize infographics and visuals over text
4. PROFESSIONAL DESIGN - Apply sophisticated visual design principles

CRITICAL RULES FOR CONTENT:
- You MUST thoroughly analyze and USE content from reference websites and documents
- Extract key information: company details, products, services, metrics, team info, etc.
- Do NOT ignore reference materials - they contain the core content for the deck
- If URLs are provided, the deck should reflect information from those URLs
- User's custom instructions override all other guidance

CRITICAL RULES FOR BRAND ASSETS:
- If BRAND ASSETS section is provided, USE THOSE EXACT COLORS in the theme
- If logo URL is provided, include it in title slides and final slides
- If brand images are provided, PREFER using those URLs over creating AI image prompts
- For extracted brand images, use them directly by setting imageUrl (don't create graphic.prompt)
- PRIORITY: Extracted brand images > Detailed user graphic descriptions > AI-generated images

CRITICAL RULE - INFOGRAPHICS OVER TEXT:
Default to visual storytelling. Prioritize infographics over bullet points.

LAYOUT PREFERENCE (60% image-focus, 20% stats, 15% split, 5% content max):
- "image-focus" - Charts, diagrams, infographics, process flows - USE MOST!
- "stats" - Big numbers, metrics, KPIs with visual emphasis
- "split" - Text + large visual side-by-side
- "content" - USE SPARINGLY! Only when text lists are unavoidable
- "title" - Section breaks and opening slides

WHEN TO CREATE INFOGRAPHICS:
- Problem/Solution → Diagram with icons and flows (image-focus)
- Process/Steps → Step-by-step visual flow (image-focus)
- Data/Metrics → Chart or graph visualization (image-focus)
- Features → Feature grid or icon layout (image-focus)
- Comparison → Side-by-side comparison diagram (image-focus)
- Timeline → Visual timeline with milestones (image-focus)
- Architecture → System diagram (image-focus)

CRITICAL - IF USER PROVIDES "GRAPHIC DESCRIPTION" SECTIONS:
- You MUST use those exact graphic descriptions in the graphic.prompt field
- Do NOT create your own simplified version
- Copy the full detailed description verbatim
- These descriptions are professionally crafted - use them as-is

GRAPHICS REQUIREMENTS:
- EVERY slide needs a "graphic" field with:
  - type: "image" (complex: charts, diagrams, illustrations) or "icon" (simple: icons, symbols)
  - prompt: Detailed description for AI generation
  - position: "background", "center", "side", "left", or "right"

BACKGROUNDS (DEFAULT TO GRADIENT/PATTERN - NOT SOLID):
- "gradient" - Smooth color gradients - USE THIS MOST for titles, stats, important slides
- "pattern" - Subtle geometric patterns - USE THIS for content and split slides
- "solid" - Clean solid color - USE SPARINGLY (only 10-20% of slides)
- "image" - Full background (when graphic.position is "background")

CRITICAL: Most slides should use "gradient" or "pattern" - NOT "solid"!

CONTENT FORMATTING:
- Headlines: 3-8 words, action-oriented
- Bullet Points: Use • prefix, 3-5 max, under 12 words each
- Stats: Big number + label (e.g., "500K+ Users")
- Minimize text - maximize visual impact

OUTPUT: Return pure JSON with complete specifications.`;
    }

    if (!claudeApiKey) {
      return NextResponse.json(
        { error: 'Claude API key not configured. Please add it in Admin Settings.' },
        { status: 500 }
      );
    }

    // Process reference materials
    let referenceMaterials = '';

    // Fetch website content
    if (urls.length > 0) {
      referenceMaterials += 'Reference Websites (EXTRACT AND USE THIS INFORMATION):\n\n';
      for (const url of urls) {
        try {
          console.log(`Fetching content from: ${url}`);
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          if (!response.ok) {
            console.error(`Failed to fetch ${url}: HTTP ${response.status}`);
            referenceMaterials += `From ${url}: (Failed to fetch - HTTP ${response.status})\n\n`;
            continue;
          }

          const html = await response.text();
          console.log(`Fetched ${html.length} characters from ${url}`);

          // Extract text content more intelligently
          let text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
            .replace(/<[^>]*>/g, ' ') // Remove HTML tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

          // Take first 8000 characters for better context
          text = text.substring(0, 8000);

          console.log(`Extracted ${text.length} characters of text content from ${url}`);
          referenceMaterials += `=== Content from ${url} ===\n${text}\n\n`;
        } catch (err: any) {
          console.error(`Failed to fetch ${url}:`, err.message);
          referenceMaterials += `From ${url}: (Error: ${err.message})\n\n`;
        }
      }
    }

    // Process uploaded files
    if (files.length > 0) {
      referenceMaterials += 'Reference Documents (EXTRACT AND USE THIS INFORMATION):\n\n';
      for (const file of files) {
        try {
          const text = await file.text();
          console.log(`Read ${text.length} characters from file: ${file.name}`);
          referenceMaterials += `=== Content from ${file.name} ===\n${text.substring(0, 10000)}\n\n`;
        } catch (err: any) {
          console.error(`Failed to read ${file.name}:`, err.message);
          referenceMaterials += `From ${file.name}: (Error: ${err.message})\n\n`;
        }
      }
    }

    // Extract brand assets from URLs
    let brandAssets;
    if (urls.length > 0) {
      try {
        console.log('Extracting brand assets from:', urls[0]);
        brandAssets = await extractBrandAssets(urls[0]);
        console.log('Brand assets extracted:', brandAssets);

        // Add comprehensive brand info to reference materials
        referenceMaterials += `\n\n=== BRAND ASSETS (USE THESE AS PRIMARY BRAND GUIDE) ===\n\n`;

        if (brandAssets.companyName) {
          referenceMaterials += `Company Name: ${brandAssets.companyName}\n`;
        }

        if (brandAssets.description) {
          referenceMaterials += `Company Description: ${brandAssets.description}\n`;
        }

        if (brandAssets.colors) {
          referenceMaterials += `\nBrand Colors (USE THESE EXACT COLORS):\n`;
          referenceMaterials += `- Primary: ${brandAssets.colors.primary}\n`;
          referenceMaterials += `- Secondary: ${brandAssets.colors.secondary}\n`;
          referenceMaterials += `- Accent: ${brandAssets.colors.accent}\n`;
        }

        if (brandAssets.logo) {
          referenceMaterials += `\nCompany Logo: ${brandAssets.logo}\n`;
          referenceMaterials += `CRITICAL: Use this logo URL in appropriate slides (title slide, final slide, etc.)\n`;
        }

        if (brandAssets.favicon) {
          referenceMaterials += `Favicon: ${brandAssets.favicon}\n`;
        }

        if (brandAssets.heroImage) {
          referenceMaterials += `\nHero/Featured Image: ${brandAssets.heroImage}\n`;
          referenceMaterials += `CRITICAL: This is a key brand image - use it in title or important slides\n`;
        }

        if (brandAssets.productImages && brandAssets.productImages.length > 0) {
          referenceMaterials += `\nProduct/Feature Images (USE THESE instead of generating new images):\n`;
          brandAssets.productImages.forEach((img, i) => {
            referenceMaterials += `${i + 1}. ${img}\n`;
          });
        }

        if (brandAssets.teamImages && brandAssets.teamImages.length > 0) {
          referenceMaterials += `\nTeam Images:\n`;
          brandAssets.teamImages.forEach((img, i) => {
            referenceMaterials += `${i + 1}. ${img}\n`;
          });
        }

        if (brandAssets.allImages && brandAssets.allImages.length > 0) {
          referenceMaterials += `\nAll Available Brand Images (${brandAssets.allImages.length} total):\n`;
          brandAssets.allImages.slice(0, 10).forEach((img, i) => {
            referenceMaterials += `${i + 1}. ${img}\n`;
          });
          if (brandAssets.allImages.length > 10) {
            referenceMaterials += `... and ${brandAssets.allImages.length - 10} more\n`;
          }
        }

        referenceMaterials += `\n=== END BRAND ASSETS ===\n\n`;
      } catch (err) {
        console.error('Failed to extract brand assets:', err);
      }
    }

    // === MULTI-PHASE GENERATION PATH ===
    // Use the professional 4-phase system for higher quality output
    if (useMultiPhase) {
      console.log('\n=== STARTING MULTI-PHASE GENERATION ===\n');

      try {
        // Phase 1: Content Strategy
        console.log('PHASE 1: Generating content strategy...');
        const phase1Output = await phase1_generateContent(
          claudeApiKey,
          content,
          referenceMaterials,
          instructions
        );
        console.log(`Phase 1 complete: ${phase1Output.slides.length} slides planned`);
        console.log('Deck title:', phase1Output.deckTitle);

        // Phase 2: Visual Design
        console.log('\nPHASE 2: Designing slides with visual strategy...');
        const brandColors = brandAssets?.colors ? {
          primary: brandAssets.colors.primary,
          secondary: brandAssets.colors.secondary,
          accent: brandAssets.colors.accent,
        } : undefined;

        const phase2Output = await phase2_designSlides(
          claudeApiKey,
          phase1Output,
          brandColors
        );
        console.log(`Phase 2 complete: ${phase2Output.slides.length} slides designed`);

        // Phase 3: Generate Images
        console.log('\nPHASE 3: Generating images with Leonardo.ai...');
        if (!leonardoApiKey) {
          console.warn('Leonardo API key not configured - skipping image generation');
        }

        const phase3Output = leonardoApiKey
          ? await phase3_generateImages(leonardoApiKey, phase2Output)
          : { slides: phase2Output.slides.map((s, i) => ({ slideNumber: i + 1, imageUrl: undefined })) };

        const successfulImages = phase3Output.slides.filter(s => s.imageUrl).length;
        console.log(`Phase 3 complete: ${successfulImages}/${phase3Output.slides.length} images generated`);

        // Phase 4: Assemble Final Deck
        console.log('\nPHASE 4: Assembling final deck...');
        const deckData = phase4_assembleDeck(
          phase1Output,
          phase2Output,
          phase3Output,
          brandColors
        );
        console.log('Phase 4 complete: Final deck assembled');

        // Apply brand logo if extracted
        if (brandAssets?.logo) {
          deckData.logo = brandAssets.logo;
        }

        console.log('\n=== MULTI-PHASE GENERATION COMPLETE ===');
        console.log('Final deck:', {
          name: deckData.name,
          slides: deckData.slides.length,
          withImages: deckData.slides.filter((s: any) => s.imageUrl).length,
        });

        // Save to database
        const { data: deck, error: dbError } = await supabase
          .from('pitch_decks')
          .insert({
            user_id: user.id,
            name: name || deckData.name,
            description: deckData.description || 'Generated with AI (Multi-Phase)',
            slides: deckData.slides,
            theme: deckData.theme,
            ai_generation_data: {
              content,
              instructions,
              urls,
              buildOnly,
              fillMissingGraphics,
              useMultiPhase: true,
              createdAt: new Date().toISOString(),
            },
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          return NextResponse.json(
            { error: 'Failed to save deck' },
            { status: 500 }
          );
        }

        return NextResponse.json(deck);

      } catch (error: any) {
        console.error('Multi-phase generation error:', error);
        return NextResponse.json(
          { error: `Multi-phase generation failed: ${error.message}` },
          { status: 500 }
        );
      }
    }

    // === SINGLE-PHASE GENERATION PATH (Original) ===
    // Build prompt for Claude
    let prompt: string;

    if (buildOnly && fillMissingGraphics) {
      prompt = `
IMPORTANT: BUILD ONLY MODE WITH GRAPHICS ENHANCEMENT

## User's Exact Content:
${content}

${instructions ? `## User's Exact Instructions & Layout:\n${instructions}\n` : ''}

${referenceMaterials}

BUILD ONLY MODE RULES:
- Use ONLY the content, structure, and layout the user has provided
- Follow their exact slide structure if specified
- Do NOT add, remove, or reorganize content
- Do NOT suggest improvements to text or structure

GRAPHICS ENHANCEMENT RULES:
- For slides where the user HAS specified graphics/images: Use their EXACT descriptions
- For slides where the user has NOT specified graphics/images: Suggest appropriate visual elements based on the slide content
- Recommend specific visualization types (bar chart, line graph, pie chart, icon, illustration, photo, diagram, etc.)
- Make visual suggestions that enhance the message without changing the content

Return the result as a JSON object with the following structure:`;
    } else if (buildOnly) {
      prompt = `
IMPORTANT: BUILD ONLY MODE - Use ONLY the exact content and structure provided by the user.

## User's Exact Content:
${content}

${instructions ? `## User's Exact Instructions & Layout:\n${instructions}\n` : ''}

${referenceMaterials}

BUILD ONLY MODE RULES:
- Use ONLY the content, structure, and layout the user has provided
- Follow their exact slide structure if specified
- Use their exact image descriptions if provided
- Do NOT add creative interpretation or additional content
- Do NOT reorganize their structure
- Do NOT suggest alternative layouts
- Simply convert their specifications into the JSON format below

Return the result as a JSON object with the following structure:`;
    } else {
      prompt = `
IMPORTANT: Create a professional pitch deck using ALL the information provided below.

${instructions ? `## CUSTOM INSTRUCTIONS (FOLLOW THESE EXACTLY):\n${instructions}\n\n` : ''}

${referenceMaterials ? `## REFERENCE MATERIALS (USE THIS INFORMATION):\n${referenceMaterials}\n\n` : ''}

## USER CONTENT:
${content}

CRITICAL REQUIREMENTS:
- You MUST analyze and extract information from all reference websites/documents above
- Use the reference materials to create accurate, informative slides about the company/product
- Include specific details from the URLs (metrics, features, benefits, etc.)
- Follow any custom instructions provided by the user
- Create 8-12 slides with visual storytelling (prioritize infographics)
- IF the user provides detailed "Graphic Description:" sections in their content, you MUST use those EXACT descriptions in the graphic.prompt fields - do NOT simplify or rewrite them
- DEFAULT TO "gradient" or "pattern" backgrounds - NOT "solid" (solid should be <20% of slides)

BRAND ASSETS USAGE:
- IF "BRAND ASSETS" section exists above, USE THE EXACT brand colors provided
- IF brand logo URL is provided, set it as imageUrl for title slide or key slides (no graphic.prompt needed)
- IF product/brand images are provided, use those URLs as imageUrl directly (no graphic.prompt needed)
- ONLY create graphic.prompt when no suitable brand image is available
- Extracted brand images take PRIORITY over AI-generated graphics

Return the result as a JSON object with the following structure:`;
    }

    // Add JSON format instructions (same for all modes)
    prompt += `
{
  "name": "Deck Title",
  "description": "Brief description",
  "slides": [
    {
      "type": "title",
      "layout": "center",
      "background": "gradient",
      "title": "Main Title",
      "subtitle": "Subtitle",
      "graphic": {
        "type": "image",
        "prompt": "Modern rocket launching upward against a starfield, symbolizing growth and innovation, cinematic lighting with gold and blue tones",
        "position": "background"
      }
    },
    {
      "type": "image-focus",
      "layout": "minimal",
      "background": "pattern",
      "title": "The Challenge",
      "graphic": {
        "type": "image",
        "prompt": "Visual Theme: Sales Chaos. Background: stylized pipeline or bucket leaking gold coins. Left: cluttered icons (phones, emails, sticky notes). Right: frustrated salesperson at desk, head in hand. Overlay: large white bold text 'Selling is an Art — But Chaos Kills Conversion.'",
        "position": "center"
      }
    },
    {
      "type": "split",
      "layout": "50-50",
      "background": "pattern",
      "title": "The Problem",
      "leftContent": "• Current solution is slow\\n• High operational costs\\n• Limited scalability",
      "graphic": {
        "type": "image",
        "prompt": "Visual Theme: The Leaky Bucket. Central graphic: a metal bucket filled with glowing gold liquid (representing leads). Gold streams drip through visible cracks labeled 'Missed follow-up,' 'No-show,' and 'Slow response.' Pool of gold forming beneath labeled 'Lost Revenue.' Background gradient from dark to warm gold.",
        "position": "right"
      }
    },
    {
      "type": "stats",
      "layout": "center",
      "background": "gradient",
      "mainStat": "500K+",
      "statLabel": "Active Users",
      "supportingStats": "2x growth YoY • 95% satisfaction",
      "graphic": {
        "type": "icon",
        "prompt": "Upward trending arrow chart icon in gold, glowing effect",
        "position": "background"
      }
    },
    {
      "type": "image-focus",
      "layout": "minimal",
      "background": "gradient",
      "title": "Product Architecture",
      "graphic": {
        "type": "image",
        "prompt": "Technical architecture diagram showing cloud infrastructure with servers, API layer with connecting lines, and frontend components. Modern isometric style with blue and gold color scheme. Include labels for each component.",
        "position": "center"
      }
    }
  ],
  "theme": {
    "colors": {
      "primary": "#2563eb",
      "secondary": "#7c3aed",
      "accent": "#f59e0b",
      "background": "#ffffff",
      "text": "#1f2937"
    }
  }
}

SLIDE TYPES AND WHEN TO USE THEM:
- "title" - Opening slides, section dividers (use layout: "center", background: "gradient")
- "content" - Bullet points, lists, text content (use layout: "standard", add graphic with position: "side")
- "split" - Text + image side by side (use layout: "50-50" or "60-40", rightContent: "graphic")
- "stats" - Big numbers, metrics (use layout: "center", include mainStat, statLabel, supportingStats)
- "image-focus" - Charts, diagrams, infographics (use layout: "minimal", graphic position: "center")

LAYOUTS:
- "center" - Centered content (for titles, stats)
- "standard" - Normal text layout with room for side graphic
- "minimal" - Maximum space for visual content
- "50-50" or "60-40" - Split layouts (text/graphic ratio)

BACKGROUNDS:
- "gradient" - Smooth color gradient (use for important slides)
- "solid" - Clean solid color
- "pattern" - Subtle geometric pattern
- "image" - Full background image (ensure text readability)

CONTENT FORMATTING:
- Use bullet points with • prefix
- Each bullet under 12 words
- For stats slides: mainStat is the big number, statLabel is what it represents
- Keep titles 3-8 words max

CRITICAL - Graphics Requirements:
- EVERY slide MUST have a graphic field
- graphic.type: "image" (complex visuals, charts, diagrams) or "icon" (simple icons)
- graphic.prompt: Detailed, specific description for AI generation
- graphic.position: "background", "center", "side", "right", or "left"
- DO NOT include imageUrl - it will be auto-generated
`;

    // Call Claude API - Using Claude Sonnet 4.5 (latest model as of 2025)
    console.log('Calling Claude API with model: claude-sonnet-4-5-20250929');
    console.log('API key starts with:', claudeApiKey.substring(0, 15) + '...');
    console.log('System prompt length:', systemPrompt.length);
    console.log('User prompt length:', prompt.length);
    console.log('Reference materials length:', referenceMaterials.length);
    console.log('Has URLs:', urls.length > 0);
    console.log('Has files:', files.length > 0);
    console.log('Has instructions:', !!instructions);

    let claudeResponse;
    try {
      claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      console.log('Claude API response status:', claudeResponse.status);
    } catch (err: any) {
      console.error('Failed to call Claude API:', err);
      return NextResponse.json(
        { error: 'Failed to connect to AI service. Please check your internet connection and try again. Error: ' + err.message },
        { status: 500 }
      );
    }

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text();
      console.error('Claude API error response:', error);
      console.error('Claude API status code:', claudeResponse.status);

      // Try to parse the error as JSON to get more details
      let errorMessage = 'Failed to generate deck with AI';
      let errorDetails = '';

      try {
        const errorData = JSON.parse(error);
        console.error('Parsed error data:', JSON.stringify(errorData, null, 2));

        const apiError = errorData.error?.message || errorData.message || errorData.error?.type;
        errorDetails = JSON.stringify(errorData, null, 2);

        // Provide user-friendly messages for common errors
        if (claudeResponse.status === 401) {
          errorMessage = 'Invalid Claude API key. Please update your API key in Admin Settings.';
        } else if (claudeResponse.status === 429) {
          errorMessage = 'Rate limit reached. Please wait a moment and try again.';
        } else if (claudeResponse.status === 529) {
          errorMessage = 'Claude API is currently experiencing high traffic. Please try again in a few moments.';
        } else if (claudeResponse.status === 413) {
          errorMessage = 'Content is too large. Please reduce the amount of text, URLs, or uploaded files.';
        } else if (claudeResponse.status === 400) {
          errorMessage = `Bad request to Claude API: ${apiError || 'Invalid request format'}`;
          if (errorData.error?.type) {
            errorMessage += ` (${errorData.error.type})`;
          }
        } else if (errorData.error?.type === 'overloaded_error') {
          errorMessage = 'Claude API is currently experiencing high traffic. Please try again in a few moments.';
        } else if (apiError) {
          errorMessage = `Claude API Error: ${apiError}`;
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        // If not JSON, use the text directly
        if (claudeResponse.status === 401) {
          errorMessage = 'Invalid Claude API key. Please update your API key in Admin Settings.';
        } else if (claudeResponse.status === 429) {
          errorMessage = 'Rate limit reached. Please wait a moment and try again.';
        } else if (claudeResponse.status === 529) {
          errorMessage = 'Claude API is currently experiencing high traffic. Please try again in a few moments.';
        } else if (claudeResponse.status === 413) {
          errorMessage = 'Content is too large. Please reduce the amount of text, URLs, or uploaded files.';
        } else if (claudeResponse.status === 400) {
          errorMessage = `Bad request to Claude API. Status: ${claudeResponse.status}. Response: ${error.substring(0, 200)}`;
        } else {
          errorMessage = `API Error (${claudeResponse.status}): ${error.substring(0, 200)}`;
        }
      }

      console.error('Final error message to user:', errorMessage);

      return NextResponse.json(
        { error: errorMessage, details: errorDetails },
        { status: claudeResponse.status }
      );
    }

    let claudeData;
    try {
      claudeData = await claudeResponse.json();
    } catch (err) {
      console.error('Failed to parse Claude response as JSON');
      return NextResponse.json(
        { error: 'Invalid response from AI service. Please try again.' },
        { status: 500 }
      );
    }

    if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
      console.error('Unexpected Claude response structure:', claudeData);
      return NextResponse.json(
        { error: 'Unexpected response from AI service. Please try again.' },
        { status: 500 }
      );
    }

    const responseText = claudeData.content[0].text;

    // Log the full response for debugging
    console.log('=== CLAUDE RESPONSE (first 2000 chars) ===');
    console.log(responseText.substring(0, 2000));
    console.log('=== END CLAUDE RESPONSE ===');

    // Extract JSON from response (Claude might wrap it in markdown)
    let deckData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        deckData = JSON.parse(jsonMatch[0]);
      } else {
        deckData = JSON.parse(responseText);
      }
    } catch (err) {
      console.error('Failed to parse Claude response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Log what was generated
    console.log('=== GENERATED DECK STRUCTURE ===');
    console.log('Deck name:', deckData.name);
    console.log('Number of slides:', deckData.slides?.length);
    console.log('Slide types:', deckData.slides?.map((s: any) => s.type).join(', '));
    console.log('Backgrounds:', deckData.slides?.map((s: any) => s.background).join(', '));
    console.log('Graphics count:', deckData.slides?.filter((s: any) => s.graphic).length);
    console.log('=== END DECK STRUCTURE ===');

    // Ensure slides have IDs
    deckData.slides = deckData.slides.map((slide: any, index: number) => ({
      id: `slide-${Date.now()}-${index}`,
      ...slide,
    }));

    // Generate graphics for slides
    console.log('Processing graphics for slides...');

    // Collect image prompts (complex graphics)
    const imagePrompts: { slideIndex: number; prompt: string }[] = [];
    const iconPrompts: { slideIndex: number; prompt: string }[] = [];

    deckData.slides.forEach((slide: any, index: number) => {
      if (slide.graphic) {
        if (slide.graphic.type === 'image') {
          imagePrompts.push({ slideIndex: index, prompt: slide.graphic.prompt });
        } else if (slide.graphic.type === 'icon') {
          iconPrompts.push({ slideIndex: index, prompt: slide.graphic.prompt });
        }
      }
    });

    console.log(`Found ${imagePrompts.length} images and ${iconPrompts.length} icons to generate`);

    // Generate images with Leonardo.ai
    if (imagePrompts.length > 0 && leonardoApiKey) {
      console.log('Generating images with Leonardo.ai...');
      try {
        const prompts = imagePrompts.map(p => p.prompt);
        const generatedImages = await generateLeonardoImages(leonardoApiKey, prompts);

        // Apply generated image URLs to slides
        generatedImages.forEach((image, i) => {
          if (image?.url) {
            const slideIndex = imagePrompts[i].slideIndex;
            deckData.slides[slideIndex].imageUrl = image.url;
            console.log(`Applied image to slide ${slideIndex + 1}`);
          }
        });
      } catch (err) {
        console.error('Error generating images with Leonardo.ai:', err);
      }
    } else if (imagePrompts.length > 0 && !leonardoApiKey) {
      console.warn('Leonardo API key not configured - skipping image generation');
    }

    // Generate icons with IconKit
    if (iconPrompts.length > 0 && iconkitApiKey) {
      console.log('Generating icons with IconKit...');
      try {
        const prompts = iconPrompts.map(p => p.prompt);
        const generatedIcons = await generateIcons(iconkitApiKey, prompts);

        // Apply generated icon URLs to slides
        generatedIcons.forEach((icon, i) => {
          if (icon?.url) {
            const slideIndex = iconPrompts[i].slideIndex;
            deckData.slides[slideIndex].imageUrl = icon.url;
            console.log(`Applied icon to slide ${slideIndex + 1}`);
          }
        });
      } catch (err) {
        console.error('Error generating icons with IconKit:', err);
      }
    } else if (iconPrompts.length > 0 && !iconkitApiKey) {
      console.warn('IconKit API key not configured - skipping icon generation');
    }

    // Apply brand colors to theme if extracted
    if (brandAssets?.colors && deckData.theme) {
      console.log('Applying extracted brand colors to theme');
      deckData.theme.colors = {
        ...deckData.theme.colors,
        primary: brandAssets.colors.primary,
        secondary: brandAssets.colors.secondary,
        accent: brandAssets.colors.accent,
      };
    }

    // Apply brand logo if extracted and not already set
    if (brandAssets?.logo && !deckData.logo) {
      console.log('Applying extracted brand logo');
      deckData.logo = brandAssets.logo;
    }

    // Create deck in database
    const { data: deck, error: dbError } = await supabase
      .from('pitch_decks')
      .insert({
        user_id: user.id,
        name: name || deckData.name,
        description: deckData.description || 'Generated with AI',
        slides: deckData.slides,
        theme: deckData.theme || {
          colors: {
            primary: '#2563eb',
            secondary: '#7c3aed',
            accent: '#f59e0b',
            background: '#ffffff',
            text: '#1f2937',
          },
          fontFamily: 'Inter',
        },
        ai_generation_data: {
          content,
          instructions,
          urls,
          buildOnly,
          fillMissingGraphics,
          createdAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save deck' },
        { status: 500 }
      );
    }

    return NextResponse.json(deck);

  } catch (error: any) {
    console.error('Error generating deck:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate deck' },
      { status: 500 }
    );
  }
}
