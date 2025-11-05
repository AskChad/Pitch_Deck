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
    const urlsJson = formData.get('urls') as string;
    const urls = urlsJson ? JSON.parse(urlsJson) : [];
    const files = formData.getAll('files') as File[];

    // Get Claude API key from settings
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['claude_api_key', 'claude_system_prompt']);

    const claudeApiKey = settings?.find(s => s.key === 'claude_api_key')?.value;
    const systemPrompt = settings?.find(s => s.key === 'claude_system_prompt')?.value ||
      'You are an expert pitch deck creator. Create a compelling, professional pitch deck.';

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
    const prompt = `
Create a professional pitch deck based on the following information:

## Main Content:
${content}

${instructions ? `## Custom Instructions:\n${instructions}\n` : ''}

${referenceMaterials}

Please create a pitch deck with 8-12 slides. Return the result as a JSON object with the following structure:
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

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
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

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text();
      console.error('Claude API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate deck with AI' },
        { status: 500 }
      );
    }

    const claudeData = await claudeResponse.json();
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
