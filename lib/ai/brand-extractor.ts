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
  favicon?: string;
  heroImage?: string;
  productImages: string[];
  teamImages: string[];
  allImages: string[];
  companyName?: string;
  description?: string;
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
    productImages: [],
    teamImages: [],
    allImages: [],
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

    // Extract favicon
    const favicon = extractFavicon(html, url);

    // Extract company name and description
    const companyName = extractCompanyName(html);
    const description = extractDescription(html);

    // Extract hero/feature image
    const heroImage = extractHeroImage(html, url);

    // Extract all images
    const allImages = extractImages(html, url);

    // Categorize images
    const productImages = allImages.filter(img =>
      img.toLowerCase().includes('product') ||
      img.toLowerCase().includes('screenshot') ||
      img.toLowerCase().includes('feature')
    );

    const teamImages = allImages.filter(img =>
      img.toLowerCase().includes('team') ||
      img.toLowerCase().includes('about') ||
      img.toLowerCase().includes('people')
    );

    console.log('Brand extraction complete:', {
      colors: colors.length,
      hasLogo: !!logo,
      hasFavicon: !!favicon,
      hasHeroImage: !!heroImage,
      companyName,
      description: description?.substring(0, 50),
      productImages: productImages.length,
      teamImages: teamImages.length,
      allImages: allImages.length,
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
      favicon,
      heroImage,
      productImages: productImages.slice(0, 10),
      teamImages: teamImages.slice(0, 5),
      allImages: allImages.slice(0, 20),
      companyName,
      description,
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
  // Try multiple strategies to find logo

  // 1. Look for img with logo in class/id/alt
  const logoRegex = /<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i;
  const logoMatch = html.match(logoRegex);
  if (logoMatch) {
    return resolveUrl(logoMatch[1], baseUrl);
  }

  // 2. Look for img with src containing "logo"
  const logoSrcRegex = /<img[^>]+src=["']([^"']*logo[^"']+)["']/i;
  const srcMatch = html.match(logoSrcRegex);
  if (srcMatch) {
    return resolveUrl(srcMatch[1], baseUrl);
  }

  // 3. Try meta og:image (often contains logo)
  const metaLogoRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i;
  const metaMatch = html.match(metaLogoRegex);
  if (metaMatch) {
    return resolveUrl(metaMatch[1], baseUrl);
  }

  // 4. Try Twitter card image
  const twitterRegex = /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i;
  const twitterMatch = html.match(twitterRegex);
  if (twitterMatch) {
    return resolveUrl(twitterMatch[1], baseUrl);
  }

  return undefined;
}

function extractFavicon(html: string, baseUrl: string): string | undefined {
  // Look for favicon link tags
  const faviconRegex = /<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i;
  const match = html.match(faviconRegex);
  if (match) {
    return resolveUrl(match[1], baseUrl);
  }

  // Default favicon location
  try {
    const base = new URL(baseUrl);
    return `${base.protocol}//${base.host}/favicon.ico`;
  } catch {
    return undefined;
  }
}

function extractHeroImage(html: string, baseUrl: string): string | undefined {
  // Look for hero/featured images

  // 1. og:image (often the hero)
  const ogRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i;
  const ogMatch = html.match(ogRegex);
  if (ogMatch) {
    return resolveUrl(ogMatch[1], baseUrl);
  }

  // 2. Twitter card image
  const twitterRegex = /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i;
  const twitterMatch = html.match(twitterRegex);
  if (twitterMatch) {
    return resolveUrl(twitterMatch[1], baseUrl);
  }

  // 3. First large image in hero section
  const heroRegex = /<(?:section|div)[^>]+(?:class|id)=["'][^"']*(?:hero|banner|featured)[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i;
  const heroMatch = html.match(heroRegex);
  if (heroMatch) {
    return resolveUrl(heroMatch[1], baseUrl);
  }

  return undefined;
}

function extractDescription(html: string): string | undefined {
  // Try og:description first
  const ogRegex = /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i;
  const ogMatch = html.match(ogRegex);
  if (ogMatch) {
    return ogMatch[1];
  }

  // Try meta description
  const metaRegex = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i;
  const metaMatch = html.match(metaRegex);
  if (metaMatch) {
    return metaMatch[1];
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
  const seen = new Set<string>();

  // Extract from img tags
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const url = resolveUrl(match[1], baseUrl);

    // Filter out tiny images, data URIs, SVGs, and duplicates
    if (url &&
        !url.includes('data:image') &&
        !url.endsWith('.svg') &&
        !url.includes('icon') &&
        !url.includes('avatar') &&
        !url.includes('1x1') &&
        !url.includes('pixel') &&
        !seen.has(url)) {
      images.push(url);
      seen.add(url);
    }
  }

  // Also check meta tags for additional images
  const metaImageRegex = /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/gi;
  while ((match = metaImageRegex.exec(html)) !== null) {
    const url = resolveUrl(match[1], baseUrl);
    if (url && !seen.has(url)) {
      images.push(url);
      seen.add(url);
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
