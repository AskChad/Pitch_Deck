/**
 * DALL-E 3 Image Generation
 * OpenAI's most advanced image generation model
 * Better at following detailed prompts and creating complex visuals
 */

export interface DalleImage {
  url: string;
  revised_prompt?: string;
}

export async function generateDalleImages(
  apiKey: string,
  prompts: string[],
  options: {
    quality?: 'standard' | 'hd';
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    style?: 'vivid' | 'natural';
  } = {}
): Promise<DalleImage[]> {
  const {
    quality = 'hd',
    size = '1792x1024', // Wide format for slides
    style = 'vivid'
  } = options;

  console.log(`Generating ${prompts.length} images with DALL-E 3...`);
  console.log('Quality:', quality, 'Size:', size, 'Style:', style);

  const results: DalleImage[] = [];

  // DALL-E 3 only supports one image per request
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    console.log(`\nGenerating image ${i + 1}/${prompts.length}...`);
    console.log('Prompt:', prompt.substring(0, 200) + '...');

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          quality,
          size,
          style,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`DALL-E API error for prompt ${i + 1}:`, error);
        results.push({ url: '' });
        continue;
      }

      const data = await response.json();

      if (data.data && data.data[0] && data.data[0].url) {
        const imageUrl = data.data[0].url;
        const revisedPrompt = data.data[0].revised_prompt;

        console.log(`✓ Image ${i + 1} generated successfully`);
        if (revisedPrompt) {
          console.log('Revised prompt:', revisedPrompt.substring(0, 150) + '...');
        }

        results.push({
          url: imageUrl,
          revised_prompt: revisedPrompt,
        });
      } else {
        console.error(`No image URL in response for prompt ${i + 1}`);
        results.push({ url: '' });
      }

      // Rate limiting: wait between requests
      if (i < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (err: any) {
      console.error(`Failed to generate image ${i + 1}:`, err.message);
      results.push({ url: '' });
    }
  }

  const successCount = results.filter(r => r.url).length;
  console.log(`\nDall-E generation complete: ${successCount}/${prompts.length} successful`);

  return results;
}
