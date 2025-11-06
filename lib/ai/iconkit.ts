/**
 * IconKit.ai API integration for icon generation
 */

export interface IconKitGenerationRequest {
  prompt: string;
  style?: string;
  color?: string;
  format?: string;
}

export interface IconKitIcon {
  url: string;
  id: string;
}

/**
 * Generate an icon using IconKit.ai API
 */
export async function generateIcon(
  apiKey: string,
  prompt: string,
  options: Partial<IconKitGenerationRequest> = {}
): Promise<IconKitIcon | null> {
  try {
    console.log('IconKit.ai: Generating icon with prompt:', prompt);

    const response = await fetch('https://api.iconkit.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        style: options.style || 'minimalist',
        color: options.color || 'auto',
        format: options.format || 'png',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('IconKit.ai generation failed:', error);
      return null;
    }

    const data = await response.json();

    if (data.url) {
      console.log('IconKit.ai: Icon generated successfully');
      return {
        url: data.url,
        id: data.id || Date.now().toString(),
      };
    }

    console.error('No icon URL returned from IconKit.ai');
    return null;

  } catch (error) {
    console.error('IconKit.ai error:', error);
    return null;
  }
}

/**
 * Generate multiple icons in parallel
 */
export async function generateIcons(
  apiKey: string,
  prompts: string[],
  options: Partial<IconKitGenerationRequest> = {}
): Promise<(IconKitIcon | null)[]> {
  console.log(`IconKit.ai: Generating ${prompts.length} icons...`);

  const results = await Promise.all(
    prompts.map(prompt => generateIcon(apiKey, prompt, options))
  );

  return results;
}
