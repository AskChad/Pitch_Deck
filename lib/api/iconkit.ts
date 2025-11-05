import axios from 'axios';

const ICONKIT_API_URL = 'https://api.iconkit.ai/v1';

export interface IconKitGenerationRequest {
  prompt: string;
  style?: 'line' | 'solid' | 'duotone' | '3d' | 'flat' | 'hand-drawn';
  color?: string;
  size?: number;
  format?: 'svg' | 'png';
}

export interface IconKitResponse {
  id: string;
  url: string;
  svg?: string;
  format: string;
}

export class IconKitAPI {
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
   * Generate an icon using IconKit.ai
   */
  async generateIcon(request: IconKitGenerationRequest): Promise<IconKitResponse> {
    try {
      const response = await axios.post(
        `${ICONKIT_API_URL}/generate`,
        {
          prompt: request.prompt,
          style: request.style || 'line',
          color: request.color || '#000000',
          size: request.size || 512,
          format: request.format || 'svg',
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('IconKit API Error:', error);
      throw new Error('Failed to generate icon with IconKit.ai');
    }
  }

  /**
   * Generate multiple icons for a pitch deck theme
   */
  async generateThemeIcons(
    concepts: string[],
    style: IconKitGenerationRequest['style'] = 'line',
    color?: string
  ): Promise<IconKitResponse[]> {
    const iconPromises = concepts.map(concept =>
      this.generateIcon({
        prompt: concept,
        style,
        color,
        format: 'svg',
      })
    );

    return Promise.all(iconPromises);
  }

  /**
   * Generate icon set for common pitch deck elements
   */
  async generatePitchDeckIconSet(
    brandColor?: string
  ): Promise<Record<string, IconKitResponse>> {
    const iconConcepts = {
      growth: 'growth chart trending up',
      target: 'target bullseye goal',
      team: 'team people group',
      innovation: 'lightbulb idea innovation',
      money: 'money dollar coin',
      rocket: 'rocket launch startup',
      graph: 'line graph analytics',
      globe: 'globe world global',
      shield: 'shield security protection',
      check: 'checkmark success complete',
    };

    const results: Record<string, IconKitResponse> = {};

    for (const [key, prompt] of Object.entries(iconConcepts)) {
      try {
        const icon = await this.generateIcon({
          prompt,
          style: 'line',
          color: brandColor,
          format: 'svg',
        });
        results[key] = icon;
      } catch (error) {
        console.error(`Failed to generate ${key} icon:`, error);
      }
    }

    return results;
  }

  /**
   * Generate custom icon for specific slide content
   */
  async generateSlideIcon(
    slideType: string,
    description: string,
    brandColor?: string
  ): Promise<IconKitResponse> {
    const prompt = `${slideType} ${description}, professional, clean, simple`;

    return this.generateIcon({
      prompt,
      style: 'line',
      color: brandColor || '#000000',
      format: 'svg',
    });
  }
}

export default IconKitAPI;
