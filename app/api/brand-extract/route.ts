import { NextRequest, NextResponse } from 'next/server';
import BrandExtractor from '@/lib/brand/extractor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const extractor = new BrandExtractor();
    const brandAssets = await extractor.extractBrandAssets(url);

    return NextResponse.json(brandAssets);
  } catch (error) {
    console.error('Brand extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract brand assets' },
      { status: 500 }
    );
  }
}
