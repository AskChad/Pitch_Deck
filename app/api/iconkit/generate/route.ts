import { NextRequest, NextResponse } from 'next/server';
import IconKitAPI from '@/lib/api/iconkit';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ICONKIT_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'IconKit API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt, style, color, type } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const iconkit = new IconKitAPI(apiKey);

    let result;

    if (type === 'set') {
      result = await iconkit.generatePitchDeckIconSet(color);
    } else if (type === 'theme' && Array.isArray(prompt)) {
      result = await iconkit.generateThemeIcons(prompt, style, color);
    } else {
      result = await iconkit.generateIcon({
        prompt,
        style: style || 'line',
        color,
        format: 'svg',
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('IconKit API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate icon' },
      { status: 500 }
    );
  }
}
