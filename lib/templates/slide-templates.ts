/**
 * Pre-designed slide templates with fixed layouts and styling
 * AI only fills in content - no design decisions
 */

export interface SlideTemplate {
  id: string;
  name: string;
  type: 'title' | 'problem' | 'solution' | 'stats' | 'process' | 'comparison' | 'quote' | 'cta';
  layout: {
    // Fixed layout structure
    structure: '50-50' | 'full-image' | 'image-left' | 'image-right' | 'stats-grid' | 'process-flow' | 'centered';
    // Content zones with exact positioning
    zones: ContentZone[];
  };
  // Fixed styling - AI cannot change these
  styling: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    fontSizes: {
      headline: string;
      subheadline: string;
      body: string;
    };
  };
  // What AI fills in
  contentSlots: {
    headline?: { maxLength: number; required: boolean };
    subheadline?: { maxLength: number; required: boolean };
    body?: { maxLength: number; required: boolean };
    bulletPoints?: { maxItems: number; maxLengthPerItem: number };
    stats?: { count: number };
    image?: { type: 'illustration' | 'photo' | 'icon' | 'chart' };
  };
}

interface ContentZone {
  id: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  contentType: 'text' | 'image' | 'stat' | 'icon';
  alignment: 'left' | 'center' | 'right';
}

/**
 * Template Set 1: Professional & Clean
 */
export const PROFESSIONAL_TEMPLATES: SlideTemplate[] = [
  {
    id: 'title-1',
    name: 'Title Slide - Centered',
    type: 'title',
    layout: {
      structure: 'centered',
      zones: [
        { id: 'headline', x: 10, y: 35, width: 80, height: 20, contentType: 'text', alignment: 'center' },
        { id: 'subheadline', x: 20, y: 60, width: 60, height: 10, contentType: 'text', alignment: 'center' },
      ],
    },
    styling: {
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      accentColor: '#2563EB', // Will be replaced with brand primary
      fontSizes: {
        headline: '4rem',
        subheadline: '1.5rem',
        body: '1rem',
      },
    },
    contentSlots: {
      headline: { maxLength: 60, required: true },
      subheadline: { maxLength: 100, required: false },
    },
  },

  {
    id: 'problem-1',
    name: 'Problem - Image Left, Text Right',
    type: 'problem',
    layout: {
      structure: 'image-left',
      zones: [
        { id: 'image', x: 5, y: 15, width: 40, height: 70, contentType: 'image', alignment: 'center' },
        { id: 'headline', x: 50, y: 25, width: 45, height: 15, contentType: 'text', alignment: 'left' },
        { id: 'body', x: 50, y: 45, width: 45, height: 40, contentType: 'text', alignment: 'left' },
      ],
    },
    styling: {
      backgroundColor: '#F9FAFB',
      textColor: '#1F2937',
      accentColor: '#EF4444',
      fontSizes: {
        headline: '2.5rem',
        subheadline: '1.5rem',
        body: '1.125rem',
      },
    },
    contentSlots: {
      headline: { maxLength: 50, required: true },
      body: { maxLength: 300, required: true },
      image: { type: 'illustration' },
    },
  },

  {
    id: 'solution-1',
    name: 'Solution - Image Right, Text Left',
    type: 'solution',
    layout: {
      structure: 'image-right',
      zones: [
        { id: 'headline', x: 5, y: 25, width: 45, height: 15, contentType: 'text', alignment: 'left' },
        { id: 'body', x: 5, y: 45, width: 45, height: 40, contentType: 'text', alignment: 'left' },
        { id: 'image', x: 55, y: 15, width: 40, height: 70, contentType: 'image', alignment: 'center' },
      ],
    },
    styling: {
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      accentColor: '#10B981',
      fontSizes: {
        headline: '2.5rem',
        subheadline: '1.5rem',
        body: '1.125rem',
      },
    },
    contentSlots: {
      headline: { maxLength: 50, required: true },
      body: { maxLength: 300, required: true },
      image: { type: 'illustration' },
    },
  },

  {
    id: 'stats-1',
    name: 'Stats - Big Number Grid',
    type: 'stats',
    layout: {
      structure: 'stats-grid',
      zones: [
        { id: 'headline', x: 10, y: 10, width: 80, height: 10, contentType: 'text', alignment: 'center' },
        { id: 'stat1', x: 10, y: 30, width: 25, height: 30, contentType: 'stat', alignment: 'center' },
        { id: 'stat2', x: 37.5, y: 30, width: 25, height: 30, contentType: 'stat', alignment: 'center' },
        { id: 'stat3', x: 65, y: 30, width: 25, height: 30, contentType: 'stat', alignment: 'center' },
      ],
    },
    styling: {
      backgroundColor: '#1F2937',
      textColor: '#FFFFFF',
      accentColor: '#F59E0B',
      fontSizes: {
        headline: '2rem',
        subheadline: '6rem',
        body: '1rem',
      },
    },
    contentSlots: {
      headline: { maxLength: 50, required: true },
      stats: { count: 3 },
    },
  },

  {
    id: 'process-1',
    name: 'Process - Horizontal Flow',
    type: 'process',
    layout: {
      structure: 'process-flow',
      zones: [
        { id: 'headline', x: 10, y: 10, width: 80, height: 10, contentType: 'text', alignment: 'center' },
        { id: 'step1', x: 5, y: 30, width: 20, height: 50, contentType: 'icon', alignment: 'center' },
        { id: 'step2', x: 28, y: 30, width: 20, height: 50, contentType: 'icon', alignment: 'center' },
        { id: 'step3', x: 51, y: 30, width: 20, height: 50, contentType: 'icon', alignment: 'center' },
        { id: 'step4', x: 74, y: 30, width: 20, height: 50, contentType: 'icon', alignment: 'center' },
      ],
    },
    styling: {
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      accentColor: '#8B5CF6',
      fontSizes: {
        headline: '2.5rem',
        subheadline: '1.25rem',
        body: '1rem',
      },
    },
    contentSlots: {
      headline: { maxLength: 50, required: true },
      bulletPoints: { maxItems: 4, maxLengthPerItem: 50 },
    },
  },

  {
    id: 'comparison-1',
    name: 'Comparison - Before/After',
    type: 'comparison',
    layout: {
      structure: '50-50',
      zones: [
        { id: 'headline', x: 10, y: 10, width: 80, height: 10, contentType: 'text', alignment: 'center' },
        { id: 'before-label', x: 10, y: 25, width: 35, height: 8, contentType: 'text', alignment: 'center' },
        { id: 'before-content', x: 10, y: 35, width: 35, height: 50, contentType: 'text', alignment: 'center' },
        { id: 'after-label', x: 55, y: 25, width: 35, height: 8, contentType: 'text', alignment: 'center' },
        { id: 'after-content', x: 55, y: 35, width: 35, height: 50, contentType: 'text', alignment: 'center' },
      ],
    },
    styling: {
      backgroundColor: '#F3F4F6',
      textColor: '#1F2937',
      accentColor: '#06B6D4',
      fontSizes: {
        headline: '2.5rem',
        subheadline: '1.5rem',
        body: '1.125rem',
      },
    },
    contentSlots: {
      headline: { maxLength: 50, required: true },
      bulletPoints: { maxItems: 6, maxLengthPerItem: 80 },
    },
  },

  {
    id: 'cta-1',
    name: 'Call to Action - Centered',
    type: 'cta',
    layout: {
      structure: 'centered',
      zones: [
        { id: 'headline', x: 10, y: 30, width: 80, height: 15, contentType: 'text', alignment: 'center' },
        { id: 'subheadline', x: 20, y: 50, width: 60, height: 10, contentType: 'text', alignment: 'center' },
        { id: 'cta-button', x: 35, y: 65, width: 30, height: 8, contentType: 'text', alignment: 'center' },
      ],
    },
    styling: {
      backgroundColor: '#2563EB', // Will use brand primary
      textColor: '#FFFFFF',
      accentColor: '#F59E0B',
      fontSizes: {
        headline: '3rem',
        subheadline: '1.5rem',
        body: '1.25rem',
      },
    },
    contentSlots: {
      headline: { maxLength: 60, required: true },
      subheadline: { maxLength: 100, required: false },
      body: { maxLength: 30, required: true }, // CTA button text
    },
  },
];

/**
 * Apply brand colors to templates
 */
export function applyBrandColors(
  templates: SlideTemplate[],
  brandColors: { primary: string; secondary: string; accent: string }
): SlideTemplate[] {
  return templates.map(template => ({
    ...template,
    styling: {
      ...template.styling,
      backgroundColor: template.styling.backgroundColor === '#2563EB'
        ? brandColors.primary
        : template.styling.backgroundColor,
      accentColor: brandColors.accent,
    },
  }));
}

/**
 * Select appropriate templates based on content intent
 */
export function selectTemplatesForDeck(
  slideIntents: Array<'title' | 'problem' | 'solution' | 'stats' | 'process' | 'comparison' | 'quote' | 'cta'>
): SlideTemplate[] {
  return slideIntents.map(intent => {
    const matchingTemplates = PROFESSIONAL_TEMPLATES.filter(t => t.type === intent);
    // For now, just use the first matching template
    // Later can add logic to vary templates
    return matchingTemplates[0] || PROFESSIONAL_TEMPLATES[0];
  });
}
