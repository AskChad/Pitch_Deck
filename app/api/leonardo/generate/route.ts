import { NextRequest, NextResponse } from 'next/server';
import LeonardoAPI from '@/lib/api/leonardo';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LEONARDO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Leonardo API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt, type, brandColors, style } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const leonardo = new LeonardoAPI(apiKey);

    let imageUrl: string;

    if (type === 'background') {
      imageUrl = await leonardo.generateSlideBackground(prompt, brandColors);
    } else if (type === 'illustration') {
      imageUrl = await leonardo.generateIllustration(prompt, style || 'flat');
    } else {
      imageUrl = await leonardo.generateImage({
        prompt,
        width: 1920,
        height: 1080,
      });
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Leonardo API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
