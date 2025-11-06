/**
 * Leonardo.ai API integration for image generation
 */

export interface LeonardoGenerationRequest {
  prompt: string;
  modelId?: string;
  width?: number;
  height?: number;
  num_images?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
}

export interface LeonardoImage {
  url: string;
  id: string;
}

/**
 * Generate an image using Leonardo.ai API
 */
export async function generateImage(
  apiKey: string,
  prompt: string,
  options: Partial<LeonardoGenerationRequest> = {}
): Promise<LeonardoImage | null> {
  try {
    console.log('Leonardo.ai: Generating image with prompt:', prompt.substring(0, 100) + '...');

    // Step 1: Create generation request
    const generationResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        modelId: options.modelId || 'b24e16ff-06e3-43eb-8d33-4416c2d75876', // Leonardo Phoenix (high quality)
        width: options.width || 1024,
        height: options.height || 768,
        num_images: 1,
        guidance_scale: options.guidance_scale || 7,
        num_inference_steps: options.num_inference_steps || 30,
      }),
    });

    if (!generationResponse.ok) {
      const error = await generationResponse.text();
      console.error('Leonardo.ai generation failed:', error);
      return null;
    }

    const generationData = await generationResponse.json();
    const generationId = generationData.sdGenerationJob?.generationId;

    if (!generationId) {
      console.error('No generation ID returned from Leonardo.ai');
      return null;
    }

    console.log('Leonardo.ai: Generation started, ID:', generationId);

    // Step 2: Poll for completion (max 60 seconds)
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;

      const statusResponse = await fetch(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      if (!statusResponse.ok) {
        console.error('Failed to check generation status');
        continue;
      }

      const statusData = await statusResponse.json();
      const generation = statusData.generations_by_pk;

      if (generation?.status === 'COMPLETE' && generation.generated_images?.length > 0) {
        const image = generation.generated_images[0];
        console.log('Leonardo.ai: Image generated successfully');

        return {
          url: image.url,
          id: image.id,
        };
      }

      if (generation?.status === 'FAILED') {
        console.error('Leonardo.ai generation failed');
        return null;
      }

      console.log(`Leonardo.ai: Still generating... (attempt ${attempts}/${maxAttempts})`);
    }

    console.error('Leonardo.ai: Generation timed out');
    return null;

  } catch (error) {
    console.error('Leonardo.ai error:', error);
    return null;
  }
}

/**
 * Generate multiple images in parallel
 */
export async function generateImages(
  apiKey: string,
  prompts: string[],
  options: Partial<LeonardoGenerationRequest> = {}
): Promise<(LeonardoImage | null)[]> {
  console.log(`Leonardo.ai: Generating ${prompts.length} images...`);

  // Generate images sequentially to avoid rate limits
  const results: (LeonardoImage | null)[] = [];

  for (const prompt of prompts) {
    const image = await generateImage(apiKey, prompt, options);
    results.push(image);

    // Small delay between generations to avoid rate limits
    if (image && prompts.indexOf(prompt) < prompts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
