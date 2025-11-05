import axios from 'axios';
import * as cheerio from 'cheerio';
import { BrandAssets, BrandColors } from '@/types/deck';

export class BrandExtractor {
  /**
   * Extract brand assets from a website URL
   */
  async extractBrandAssets(url: string): Promise<BrandAssets> {
    try {
      // Ensure URL has protocol
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

      // Fetch the webpage
      const response = await axios.get(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract colors
      const colors = await this.extractColors($, normalizedUrl);

      // Extract logo
      const logo = this.extractLogo($, normalizedUrl);

      // Extract favicon
      const favicon = this.extractFavicon($, normalizedUrl);

      // Extract images
      const images = this.extractImages($, normalizedUrl);

      return {
        logo,
        favicon,
        images,
        colors,
      };
    } catch (error) {
      console.error('Brand extraction error:', error);
      throw new Error('Failed to extract brand assets from URL');
    }
  }

  /**
   * Extract primary colors from website
   */
  private async extractColors($: cheerio.CheerioAPI, baseUrl: string): Promise<BrandColors> {
    const colors: string[] = [];

    // Extract colors from inline styles
    $('[style*="color"], [style*="background"]').each((_, elem) => {
      const style = $(elem).attr('style') || '';
      const colorMatches = style.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)/g);
      if (colorMatches) {
        colors.push(...colorMatches);
      }
    });

    // Extract from CSS variables
    const styleContent = $('style').text();
    const cssVarMatches = styleContent.match(/--[^:]+:\s*(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\))/g);
    if (cssVarMatches) {
      cssVarMatches.forEach(match => {
        const color = match.split(':')[1].trim();
        colors.push(color);
      });
    }

    // Get unique colors and convert to hex
    const uniqueColors = [...new Set(colors)]
      .map(c => this.normalizeColor(c))
      .filter(c => c !== null) as string[];

    // Return default colors if extraction fails
    if (uniqueColors.length === 0) {
      return {
        primary: '#2563eb',
        secondary: '#7c3aed',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937',
      };
    }

    // Assign colors to brand palette
    return {
      primary: uniqueColors[0] || '#2563eb',
      secondary: uniqueColors[1] || uniqueColors[0] || '#7c3aed',
      accent: uniqueColors[2] || uniqueColors[0] || '#f59e0b',
      background: this.findBackgroundColor(uniqueColors) || '#ffffff',
      text: this.findTextColor(uniqueColors) || '#1f2937',
    };
  }

  /**
   * Extract logo from website
   */
  private extractLogo($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
    const logoSelectors = [
      'img[class*="logo"]',
      'img[id*="logo"]',
      'a[class*="logo"] img',
      '.logo img',
      '#logo img',
      'header img',
      '.header img',
      'nav img',
    ];

    for (const selector of logoSelectors) {
      const logoImg = $(selector).first();
      if (logoImg.length) {
        const src = logoImg.attr('src');
        if (src) {
          return this.resolveUrl(src, baseUrl);
        }
      }
    }

    return undefined;
  }

  /**
   * Extract favicon from website
   */
  private extractFavicon($: cheerio.CheerioAPI, baseUrl: string): string | undefined {
    const faviconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
    ];

    for (const selector of faviconSelectors) {
      const favicon = $(selector).first();
      if (favicon.length) {
        const href = favicon.attr('href');
        if (href) {
          return this.resolveUrl(href, baseUrl);
        }
      }
    }

    // Default favicon location
    const urlObj = new URL(baseUrl);
    return `${urlObj.origin}/favicon.ico`;
  }

  /**
   * Extract images from website
   */
  private extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const images: string[] = [];
    const maxImages = 10;

    $('img').each((_, elem) => {
      if (images.length >= maxImages) return false;

      const src = $(elem).attr('src');
      if (src && !src.includes('logo') && !src.includes('icon')) {
        const resolvedUrl = this.resolveUrl(src, baseUrl);
        if (resolvedUrl) {
          images.push(resolvedUrl);
        }
      }
    });

    return images;
  }

  /**
   * Resolve relative URLs to absolute
   */
  private resolveUrl(url: string, baseUrl: string): string {
    try {
      if (url.startsWith('http')) {
        return url;
      }
      if (url.startsWith('//')) {
        return `https:${url}`;
      }
      if (url.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        return `${urlObj.origin}${url}`;
      }
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  /**
   * Normalize color to hex format
   */
  private normalizeColor(color: string): string | null {
    // Already hex
    if (color.startsWith('#')) {
      return color.length === 4
        ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
        : color;
    }

    // RGB to hex
    if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        const r = parseInt(matches[0]).toString(16).padStart(2, '0');
        const g = parseInt(matches[1]).toString(16).padStart(2, '0');
        const b = parseInt(matches[2]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }
    }

    return null;
  }

  /**
   * Find likely background color from color palette
   */
  private findBackgroundColor(colors: string[]): string | null {
    // Look for light colors that could be backgrounds
    for (const color of colors) {
      const brightness = this.getColorBrightness(color);
      if (brightness > 200) {
        return color;
      }
    }
    return null;
  }

  /**
   * Find likely text color from color palette
   */
  private findTextColor(colors: string[]): string | null {
    // Look for dark colors that could be text
    for (const color of colors) {
      const brightness = this.getColorBrightness(color);
      if (brightness < 100) {
        return color;
      }
    }
    return null;
  }

  /**
   * Calculate color brightness (0-255)
   */
  private getColorBrightness(hexColor: string): number {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }
}

export default BrandExtractor;
