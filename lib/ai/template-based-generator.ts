/**
 * Template-Based Generation System
 * AI ONLY fills in content - all design is pre-determined
 */

import { PROFESSIONAL_TEMPLATES, applyBrandColors, selectTemplatesForDeck, SlideTemplate } from '../templates/slide-templates';

interface TemplateBasedOutput {
  name: string;
  description: string;
  slides: any[];
  theme: any;
}

/**
 * Generate deck using templates - AI only provides content
 */
export async function generateDeckWithTemplates(
  apiKey: string,
  userContent: string,
  referenceMaterials: string,
  brandColors: { primary: string; secondary: string; accent: string },
  instructions?: string
): Promise<TemplateBasedOutput> {

  console.log('=== TEMPLATE-BASED GENERATION ===');
  console.log('AI will ONLY fill content into pre-designed templates');
  console.log('Brand colors:', brandColors);

  // Step 1: AI decides content and slide types (but NOT design)
  const contentStrategy = await generateContentStrategy(apiKey, userContent, referenceMaterials, instructions);

  console.log(`Content strategy: ${contentStrategy.slides.length} slides`);
  console.log('Slide types:', contentStrategy.slides.map(s => s.type).join(', '));

  // Step 2: Select pre-designed templates based on slide types
  const slideIntents = contentStrategy.slides.map(s => s.type);
  const templates = selectTemplatesForDeck(slideIntents);
  const brandedTemplates = applyBrandColors(templates, brandColors);

  console.log('Templates selected with brand colors applied');

  // Step 3: Fill templates with AI-generated content
  const slides = contentStrategy.slides.map((content, index) => {
    const template = brandedTemplates[index];
    return fillTemplate(template, content, brandColors);
  });

  return {
    name: contentStrategy.deckTitle,
    description: contentStrategy.deckDescription,
    slides,
    theme: {
      colors: brandColors,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
  };
}

/**
 * Step 1: AI generates content strategy (NO design decisions)
 */
async function generateContentStrategy(
  apiKey: string,
  userContent: string,
  referenceMaterials: string,
  instructions?: string
) {
  const systemPrompt = `You are a content strategist. You ONLY decide:
1. What content goes on each slide
2. What TYPE of slide it should be (title, problem, solution, stats, process, comparison, cta)

You do NOT decide:
- Colors (handled by brand guidelines)
- Layouts (handled by pre-designed templates)
- Typography (handled by templates)
- Image styles (handled by templates)

SLIDE TYPES:
- title: Opening slide
- problem: Problem statement
- solution: How you solve it
- stats: Data/metrics (provide 2-3 specific numbers)
- process: Step-by-step (provide 3-4 steps)
- comparison: Before vs After
- cta: Call to action

Extract ALL specific data from reference materials. Use real numbers, real processes, real quotes.

Return JSON only:
{
  "deckTitle": "Title",
  "deckDescription": "Description",
  "slides": [
    {
      "type": "title",
      "headline": "Main message (60 chars max)",
      "subheadline": "Supporting text (100 chars max)",
      "body": "Additional text if needed (300 chars max)",
      "bulletPoints": ["point 1", "point 2"],
      "stats": [{"number": "95%", "label": "Success rate"}],
      "imagePrompt": "Specific description for illustration"
    }
  ]
}`;

  const userPrompt = `${instructions ? `INSTRUCTIONS: ${instructions}\n\n` : ''}
${referenceMaterials ? `REFERENCE MATERIALS:\n${referenceMaterials}\n\n` : ''}

USER CONTENT:
${userContent}

Create 8-12 slides. Extract specific data from materials. Be concise.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Content strategy failed: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Step 3: Fill template with content
 */
function fillTemplate(
  template: SlideTemplate,
  content: any,
  brandColors: { primary: string; secondary: string; accent: string }
): any {

  const slide: any = {
    type: template.layout.structure,
    backgroundColor: template.styling.backgroundColor
      .replace('#2563EB', brandColors.primary)
      .replace('#FFFFFF', '#FFFFFF'),
    textColor: template.styling.textColor,
  };

  // Fill content based on template type
  switch (template.type) {
    case 'title':
      slide.title = content.headline || '';
      slide.subtitle = content.subheadline || '';
      break;

    case 'problem':
    case 'solution':
      slide.title = content.headline || '';
      slide.content = content.body || content.bulletPoints?.join('\n• ') || '';
      if (content.imagePrompt) {
        slide.graphic = {
          type: 'image',
          prompt: content.imagePrompt,
          position: 'left',
        };
      }
      break;

    case 'stats':
      slide.title = content.headline || '';
      slide.stats = content.stats || [];
      break;

    case 'process':
      slide.title = content.headline || '';
      slide.steps = content.bulletPoints || [];
      break;

    case 'comparison':
      slide.title = content.headline || '';
      slide.leftContent = content.bulletPoints?.slice(0, 3).join('\n• ') || '';
      slide.rightContent = content.bulletPoints?.slice(3).join('\n• ') || '';
      break;

    case 'cta':
      slide.title = content.headline || '';
      slide.subtitle = content.subheadline || '';
      slide.ctaText = content.body || 'Get Started';
      break;
  }

  return slide;
}
