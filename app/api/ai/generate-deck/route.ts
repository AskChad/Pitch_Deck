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
      `You are an expert pitch deck creator and storyteller. Your mission is to transform ideas into compelling visual narratives.

CORE PRINCIPLES:
- Storytelling First: Every deck tells a story - make it memorable and engaging
- Visual Over Text: Minimize text, maximize impact. Use graphics, data visualizations, and imagery
- Audience-Centric: Tailor tone and content to the target audience
- Clarity & Simplicity: Complex ideas expressed simply

STRUCTURE FLEXIBILITY:
- If user provides a specific structure or outline, FOLLOW IT EXACTLY
- If no structure provided, use the classic pitch deck flow:
  1. Title/Hook - Grab attention immediately
  2. Problem - Paint the pain point vividly
  3. Solution - Your product as the hero
  4. Market - Size the opportunity
  5. Product - Show, don't tell
  6. Traction - Prove momentum with data
  7. Team - Why you'll win
  8. Ask - Clear call to action

CONTENT GUIDELINES:
- Headlines: Bold, memorable, action-oriented (5-10 words max)
- Body Text: Bullet points only, 3-5 per slide, each under 10 words
- Data: Use specific numbers, percentages, growth metrics
- Graphics: Suggest charts, diagrams, icons, or images for EVERY slide
- Storytelling: Create narrative flow between slides

VISUAL SUGGESTIONS:
- For each slide, recommend specific visual elements (charts, icons, imagery)
- Indicate where graphics should replace text
- Suggest data visualization types (bar chart, line graph, pie chart, etc.)

GRAPHICS OUTPUT FORMAT:
- For each slide that needs a graphic, include a "graphic" field with:
  - type: "image" (complex graphics like charts, diagrams, illustrations) or "icon" (simple icons)
  - prompt: Detailed description for AI generation (e.g., "A 3D leaky bucket with water dripping out, symbolizing customer churn")
  - position: "background", "center", "side", or "inline"
- Images will be generated with Leonardo.ai (high-quality illustrations, charts, diagrams)
- Icons will be generated with IconKit.ai (simple, clean icons)

OUTPUT FORMAT:
Return pure JSON with compelling content and visual guidance.`;
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
      "title": "Slide Title",
      "content": "Bullet points or content",
      "graphic": {
        "type": "image",
        "prompt": "A detailed illustration of a leaky bucket with water dripping, representing customer churn",
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

Use slide types: "title", "content", "two-column", "image"
For two-column: include "leftContent" and "rightContent"
For image: include "imageUrl" (will be generated if graphic field is provided)

IMPORTANT - Graphics Field:
- Add "graphic" field to slides that need visual elements
- graphic.type: "image" for complex graphics (charts, diagrams, illustrations) or "icon" for simple icons
- graphic.prompt: Detailed description for AI image generation
- graphic.position: "background", "center", "side", or "inline"
- DO NOT include imageUrl - it will be auto-generated from the graphic prompt
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
