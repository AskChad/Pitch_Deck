import axios from 'axios';

const LEONARDO_API_URL = 'https://cloud.leonardo.ai/api/rest/v1';

export interface LeonardoGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  num_images?: number;
  width?: number;
  height?: number;
  guidance_scale?: number;
  modelId?: string;
  stylePreset?: string;
}

export interface LeonardoImage {
  id: string;
  url: string;
  nsfw: boolean;
  likeCount: number;
}

export interface LeonardoGenerationResponse {
  sdGenerationJob: {
    generationId: string;
    apiCreditCost: number;
  };
}

export class LeonardoAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Generate images using Leonardo.ai
   */
  async generateImage(request: LeonardoGenerationRequest): Promise<string> {
    try {
      const response = await axios.post<LeonardoGenerationResponse>(
        `${LEONARDO_API_URL}/generations`,
        {
          prompt: request.prompt,
          negative_prompt: request.negative_prompt || '',
          num_images: request.num_images || 1,
          width: request.width || 1024,
          height: request.height || 768,
          guidance_scale: request.guidance_scale || 7,
          modelId: request.modelId || '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3', // Leonardo Creative
          preset_style: request.stylePreset || 'LEONARDO',
        },
        { headers: this.getHeaders() }
      );

      const generationId = response.data.sdGenerationJob.generationId;

      // Poll for completion
      const imageUrl = await this.pollGeneration(generationId);
      return imageUrl;
    } catch (error) {
      console.error('Leonardo API Error:', error);
      throw new Error('Failed to generate image with Leonardo.ai');
    }
  }

  /**
   * Poll generation status until complete
   */
  private async pollGeneration(generationId: string): Promise<string> {
    const maxAttempts = 30;
    const pollInterval = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      try {
        const response = await axios.get(
          `${LEONARDO_API_URL}/generations/${generationId}`,
          { headers: this.getHeaders() }
        );

        const generation = response.data.generations_by_pk;

        if (generation.status === 'COMPLETE') {
          const images = generation.generated_images;
          if (images && images.length > 0) {
            return images[0].url;
          }
          throw new Error('No images generated');
        }

        if (generation.status === 'FAILED') {
          throw new Error('Image generation failed');
        }
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('Image generation timeout');
  }

  /**
   * Get available models
   */
  async getModels() {
    try {
      const response = await axios.get(
        `${LEONARDO_API_URL}/platformModels`,
        { headers: this.getHeaders() }
      );
      return response.data.custom_models;
    } catch (error) {
      console.error('Failed to fetch Leonardo models:', error);
      throw error;
    }
  }

  /**
   * Generate image optimized for pitch deck slides
   */
  async generateSlideBackground(
    description: string,
    brandColors?: string[]
  ): Promise<string> {
    const colorPrompt = brandColors?.length
      ? `using brand colors: ${brandColors.join(', ')}`
      : '';

    const prompt = `professional pitch deck slide background, ${description}, ${colorPrompt}, modern, clean, corporate, high quality, minimalist design`;

    return this.generateImage({
      prompt,
      negative_prompt: 'text, words, letters, people, faces, cluttered, busy',
      width: 1920,
      height: 1080,
      stylePreset: 'CINEMATIC',
    });
  }

  /**
   * Generate icon/illustration for slide
   */
  async generateIllustration(
    concept: string,
    style: 'flat' | '3d' | 'isometric' | 'minimal' = 'flat'
  ): Promise<string> {
    const stylePrompts = {
      flat: 'flat design, vector art, simple',
      '3d': '3D render, modern, glossy',
      isometric: 'isometric view, clean lines',
      minimal: 'minimalist, simple shapes, clean',
    };

    const prompt = `${concept}, ${stylePrompts[style]}, professional, high quality, centered, white background`;

    return this.generateImage({
      prompt,
      negative_prompt: 'photo, realistic, complex, detailed background, text',
      width: 1024,
      height: 1024,
    });
  }
}

export default LeonardoAPI;
