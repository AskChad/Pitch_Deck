/**
 * Brand asset extraction from URLs
 */

export interface BrandAssets {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  logo?: string;
  images: string[];
  companyName?: string;
}

/**
 * Extract brand colors and assets from a website URL
 */
export async function extractBrandAssets(url: string): Promise<BrandAssets> {
  console.log('Extracting brand assets from:', url);

  const defaultAssets: BrandAssets = {
    colors: {
      primary: '#2563eb',
      secondary: '#7c3aed',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#1f2937',
    },
    images: [],
  };

  try {
    // Fetch the website HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch URL:', response.status);
      return defaultAssets;
    }

    const html = await response.text();

    // Extract colors from various sources
    const colors = extractColors(html);

    // Extract logo URL
    const logo = extractLogo(html, url);

    // Extract company name
    const companyName = extractCompanyName(html);

    // Extract images
    const images = extractImages(html, url);

    console.log('Brand extraction complete:', {
      colors: colors.length,
      hasLogo: !!logo,
      companyName,
      images: images.length,
    });

    return {
      colors: colors.length > 0 ? {
        primary: colors[0] || defaultAssets.colors.primary,
        secondary: colors[1] || defaultAssets.colors.secondary,
        accent: colors[2] || defaultAssets.colors.accent,
        background: defaultAssets.colors.background,
        text: defaultAssets.colors.text,
      } : defaultAssets.colors,
      logo,
      images: images.slice(0, 5), // Limit to 5 images
      companyName,
    };

  } catch (error) {
    console.error('Error extracting brand assets:', error);
    return defaultAssets;
  }
}

function extractColors(html: string): string[] {
  const colors: string[] = [];

  // Extract from CSS variables
  const cssVarRegex = /--[\w-]+:\s*(#[0-9a-fA-F]{6}|rgb\([^)]+\))/g;
  let match;
  while ((match = cssVarRegex.exec(html)) !== null) {
    colors.push(normalizeColor(match[1]));
  }

  // Extract from inline styles and style tags
  const colorRegex = /#[0-9a-fA-F]{6}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g;
  const matches = html.match(colorRegex);
  if (matches) {
    colors.push(...matches.map(normalizeColor));
  }

  // Remove duplicates and filter out near-white/black colors
  const uniqueColors = Array.from(new Set(colors))
    .filter(color => !isNearWhiteOrBlack(color));

  return uniqueColors.slice(0, 3); // Return top 3 colors
}

function extractLogo(html: string, baseUrl: string): string | undefined {
  // Try to find logo in meta tags
  const metaLogoRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i;
  const metaMatch = html.match(metaLogoRegex);
  if (metaMatch) {
    return resolveUrl(metaMatch[1], baseUrl);
  }

  // Try to find logo img tags
  const logoRegex = /<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i;
  const logoMatch = html.match(logoRegex);
  if (logoMatch) {
    return resolveUrl(logoMatch[1], baseUrl);
  }

  return undefined;
}

function extractCompanyName(html: string): string | undefined {
  // Try og:site_name first
  const siteNameRegex = /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i;
  const siteMatch = html.match(siteNameRegex);
  if (siteMatch) {
    return siteMatch[1];
  }

  // Try title tag
  const titleRegex = /<title>([^<]+)<\/title>/i;
  const titleMatch = html.match(titleRegex);
  if (titleMatch) {
    return titleMatch[1].split('|')[0].split('-')[0].trim();
  }

  return undefined;
}

function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];

  // Extract from img tags
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const url = resolveUrl(match[1], baseUrl);
    if (url && !url.includes('data:image') && !url.includes('.svg')) {
      images.push(url);
    }
  }

  return images;
}

function normalizeColor(color: string): string {
  // Convert rgb to hex
  if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0]);
      const g = parseInt(match[1]);
      const b = parseInt(match[2]);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
  }
  return color.toUpperCase();
}

function isNearWhiteOrBlack(color: string): boolean {
  if (!color.startsWith('#')) return false;

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  const brightness = (r + g + b) / 3;

  return brightness < 30 || brightness > 225;
}

function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http')) {
    return url;
  }

  try {
    const base = new URL(baseUrl);
    if (url.startsWith('//')) {
      return `${base.protocol}${url}`;
    }
    if (url.startsWith('/')) {
      return `${base.protocol}//${base.host}${url}`;
    }
    return `${base.protocol}//${base.host}/${url}`;
  } catch {
    return url;
  }
}
