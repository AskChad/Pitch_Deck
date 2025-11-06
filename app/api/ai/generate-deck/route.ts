import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get Claude API key from settings
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['claude_api_key', 'claude_system_prompt']);

    const claudeApiKey = settings?.find(s => s.key === 'claude_api_key')?.value;

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
- Recommend specific visualization types where applicable (bar chart, line graph, pie chart, icon, illustration, etc.)`;
    } else if (buildOnly) {
      systemPrompt = `You are a precise pitch deck builder. Your role is to convert user specifications into structured slide decks WITHOUT adding any creative interpretation.

STRICT RULES:
- Use ONLY the exact content provided by the user
- Follow their exact structure and layout specifications
- Use their exact image descriptions without modification
- Do NOT add, remove, or reorganize content
- Do NOT suggest improvements or alternatives
- Act as a pure conversion tool from user specs to JSON format`;
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
      "subtitle": "Subtitle"
    },
    {
      "type": "content",
      "title": "Slide Title",
      "content": "Bullet points or content"
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
For image: include "imageUrl" (use placeholder if needed)
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
