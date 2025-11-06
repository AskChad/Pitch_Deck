import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateImages as generateLeonardoImages } from '@/lib/ai/leonardo';
import { generateIcons } from '@/lib/ai/iconkit';
import { extractBrandAssets } from '@/lib/ai/brand-extractor';

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
      `You are an expert pitch deck creator and visual designer. Your mission is to create presentation-ready slides with professional layouts, graphics, and visual design.

CORE PRINCIPLES:
- Storytelling First: Every deck tells a story - make it memorable and engaging
- Visual Over Text: Minimize text, maximize impact. Use graphics, data visualizations, and imagery
- Professional Design: Every slide must be visually polished and presentation-ready
- Smart Layouts: Choose the right layout for each content type

DESIGN DECISION MAKING:
You must make intelligent decisions about HOW to present each piece of content:

1. TEXT vs INFOGRAPHICS:
   - Use bullet points for: lists, features, benefits, key points
   - Use charts/graphs for: data, metrics, growth, comparisons
   - Use diagrams for: processes, flows, relationships, systems
   - Use illustrations for: concepts, metaphors, emotional impact

2. LAYOUT SELECTION:
   - "title" - Opening slides, section breaks, big statements
   - "content" - Text-heavy information (but still add visuals!)
   - "image-focus" - When visual is the star (use for infographics, charts, key illustrations)
   - "split" - Text on one side, visual on other (great for balanced content)
   - "stats" - Big numbers with context (revenue, growth, users, etc.)

3. VISUAL STRATEGY FOR EACH SLIDE:
   - EVERY slide needs a visual element (no plain text slides!)
   - Title slides: Bold background gradient + icon
   - Content slides: Side illustration or background pattern + icons for bullets
   - Data slides: Charts, graphs, or big number displays
   - Concept slides: Illustrations, diagrams, metaphors

4. BACKGROUND STYLING:
   Choose appropriate background for each slide:
   - "gradient" - Smooth color gradients (great for titles, transitions)
   - "solid" - Clean solid color with accent elements
   - "pattern" - Subtle geometric patterns
   - "image" - Full background image (use sparingly, ensure text readability)

CONTENT FORMATTING:
- Headlines: Bold, memorable, action-oriented (3-8 words max)
- Bullet Points: Use • prefix, 3-5 points max, each under 12 words
- Numbers/Stats: Display prominently with context (e.g., "500K+ Users" not "We have 500,000 users")
- Keep text minimal - let visuals tell the story

GRAPHICS REQUIREMENTS:
- EVERY slide must have a graphic field
- Choose between "image" (complex) or "icon" (simple) based on content
- Position: "background", "side", "center", or "split"
- Prompts must be detailed and specific for AI generation

OUTPUT FORMAT:
Return pure JSON with complete design specifications for presentation-ready slides.`;
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
      referenceMaterials += '\n\n## Reference Websites:\n';
      for (const url of urls) {
        try {
          const response = await fetch(url);
          const html = await response.text();
          // Simple text extraction (in production, use a proper HTML parser)
          const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 5000);
          referenceMaterials += `\nFrom ${url}:\n${text}\n`;
        } catch (err) {
          console.error(`Failed to fetch ${url}:`, err);
          referenceMaterials += `\nFrom ${url}: (Failed to fetch)\n`;
        }
      }
    }

    // Process uploaded files
    if (files.length > 0) {
      referenceMaterials += '\n\n## Reference Documents:\n';
      for (const file of files) {
        try {
          const text = await file.text();
          referenceMaterials += `\nFrom ${file.name}:\n${text.substring(0, 10000)}\n`;
        } catch (err) {
          console.error(`Failed to read ${file.name}:`, err);
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

        // Add brand info to reference materials
        if (brandAssets.companyName) {
          referenceMaterials += `\n\n## Brand Information:\nCompany Name: ${brandAssets.companyName}\n`;
        }
        if (brandAssets.logo) {
          referenceMaterials += `Logo URL: ${brandAssets.logo}\n`;
        }
        if (brandAssets.colors) {
          referenceMaterials += `Brand Colors:\n- Primary: ${brandAssets.colors.primary}\n- Secondary: ${brandAssets.colors.secondary}\n- Accent: ${brandAssets.colors.accent}\n`;
        }
      } catch (err) {
        console.error('Failed to extract brand assets:', err);
      }
    }

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
Create a professional pitch deck based on the following information:

## Main Content:
${content}

${instructions ? `## Custom Instructions:\n${instructions}\n` : ''}

${referenceMaterials}

Please create a pitch deck with 8-12 slides. Return the result as a JSON object with the following structure:`;
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
        "type": "icon",
        "prompt": "Modern rocket launching upward symbolizing growth",
        "position": "background"
      }
    },
    {
      "type": "content",
      "layout": "standard",
      "background": "solid",
      "title": "Key Benefits",
      "content": "• Fast implementation\\n• Cost effective\\n• Scalable solution",
      "graphic": {
        "type": "image",
        "prompt": "Abstract geometric shapes representing growth and efficiency, modern minimal style",
        "position": "side"
      }
    },
    {
      "type": "split",
      "layout": "50-50",
      "background": "pattern",
      "title": "The Problem",
      "leftContent": "• Current solution is slow\\n• High operational costs\\n• Limited scalability",
      "rightContent": "graphic",
      "graphic": {
        "type": "image",
        "prompt": "A detailed illustration of a leaky bucket with water dripping, representing customer churn",
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
        "prompt": "Upward trending arrow chart icon",
        "position": "background"
      }
    },
    {
      "type": "image-focus",
      "layout": "minimal",
      "background": "solid",
      "title": "Product Architecture",
      "graphic": {
        "type": "image",
        "prompt": "Technical architecture diagram showing cloud infrastructure, API layer, and frontend components",
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
