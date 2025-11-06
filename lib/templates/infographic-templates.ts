/**
 * Pre-designed infographic and chart templates
 * These render as SVG with data filled in by AI
 */

export type InfographicType =
  | 'bar-chart'
  | 'line-chart'
  | 'pie-chart'
  | 'donut-chart'
  | 'stat-card'
  | 'progress-bar'
  | 'timeline'
  | 'process-flow'
  | 'comparison-bars'
  | 'icon-grid'
  | 'funnel'
  | 'pyramid';

export interface InfographicTemplate {
  id: string;
  type: InfographicType;
  name: string;
  description: string;
  // What data AI needs to provide
  dataStructure: {
    [key: string]: {
      type: 'number' | 'string' | 'percentage' | 'array';
      required: boolean;
      example: any;
    };
  };
  // Fixed styling (uses brand colors)
  styling: {
    primaryColor: string; // Will be replaced with brand primary
    secondaryColor: string; // Will be replaced with brand secondary
    accentColor: string; // Will be replaced with brand accent
    textColor: string;
    backgroundColor: string;
  };
  // SVG generator function
  generate: (data: any, colors: any) => string;
}

/**
 * INFOGRAPHIC TEMPLATES
 */

export const INFOGRAPHIC_TEMPLATES: InfographicTemplate[] = [
  {
    id: 'bar-chart-3',
    type: 'bar-chart',
    name: 'Vertical Bar Chart (3 bars)',
    description: 'Compare 3 metrics with vertical bars',
    dataStructure: {
      bars: {
        type: 'array',
        required: true,
        example: [
          { label: 'Before', value: 45 },
          { label: 'During', value: 72 },
          { label: 'After', value: 95 }
        ]
      },
      title: { type: 'string', required: false, example: 'Revenue Growth' }
    },
    styling: {
      primaryColor: '#2563EB',
      secondaryColor: '#7C3AED',
      accentColor: '#F59E0B',
      textColor: '#1F2937',
      backgroundColor: '#FFFFFF'
    },
    generate: (data, colors) => {
      const { bars, title } = data;
      const maxValue = Math.max(...bars.map((b: any) => b.value));

      return `
        <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
          <!-- Background -->
          <rect width="600" height="400" fill="${colors.backgroundColor}" rx="8"/>

          <!-- Title -->
          ${title ? `<text x="300" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="${colors.textColor}">${title}</text>` : ''}

          <!-- Grid lines -->
          ${[0, 25, 50, 75, 100].map(val => `
            <line x1="80" y1="${350 - (val * 2.5)}" x2="520" y2="${350 - (val * 2.5)}"
                  stroke="#E5E7EB" stroke-width="1" stroke-dasharray="4,4"/>
            <text x="65" y="${355 - (val * 2.5)}" text-anchor="end" font-size="12" fill="${colors.textColor}">${val}%</text>
          `).join('')}

          <!-- Bars -->
          ${bars.map((bar: any, i: number) => {
            const barWidth = 100;
            const barX = 120 + (i * 160);
            const barHeight = (bar.value / maxValue) * 250;
            const barY = 350 - barHeight;
            const barColor = i === 0 ? colors.primaryColor : i === 1 ? colors.secondaryColor : colors.accentColor;

            return `
              <!-- Bar ${i + 1} -->
              <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}"
                    fill="${barColor}" rx="4">
                <animate attributeName="height" from="0" to="${barHeight}" dur="0.8s" fill="freeze"/>
                <animate attributeName="y" from="350" to="${barY}" dur="0.8s" fill="freeze"/>
              </rect>

              <!-- Value label -->
              <text x="${barX + 50}" y="${barY - 10}" text-anchor="middle"
                    font-size="20" font-weight="bold" fill="${barColor}">${bar.value}%</text>

              <!-- Bar label -->
              <text x="${barX + 50}" y="375" text-anchor="middle"
                    font-size="14" font-weight="600" fill="${colors.textColor}">${bar.label}</text>
            `;
          }).join('')}
        </svg>
      `;
    }
  },

  {
    id: 'pie-chart',
    type: 'pie-chart',
    name: 'Pie Chart',
    description: 'Show percentage breakdown',
    dataStructure: {
      slices: {
        type: 'array',
        required: true,
        example: [
          { label: 'Product A', value: 45 },
          { label: 'Product B', value: 30 },
          { label: 'Product C', value: 25 }
        ]
      },
      title: { type: 'string', required: false, example: 'Market Share' }
    },
    styling: {
      primaryColor: '#2563EB',
      secondaryColor: '#7C3AED',
      accentColor: '#F59E0B',
      textColor: '#1F2937',
      backgroundColor: '#FFFFFF'
    },
    generate: (data, colors) => {
      const { slices, title } = data;
      const total = slices.reduce((sum: number, s: any) => sum + s.value, 0);
      const colorPalette = [colors.primaryColor, colors.secondaryColor, colors.accentColor, '#10B981', '#EF4444'];

      let currentAngle = -90; // Start at top
      const centerX = 300;
      const centerY = 220;
      const radius = 120;

      const slicePaths = slices.map((slice: any, i: number) => {
        const sliceAngle = (slice.value / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;

        const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
        const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
        const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
        const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

        const largeArcFlag = sliceAngle > 180 ? 1 : 0;

        const path = `M ${centerX},${centerY} L ${startX},${startY} A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} Z`;

        // Legend position
        const legendY = 100 + (i * 35);

        currentAngle = endAngle;

        return `
          <path d="${path}" fill="${colorPalette[i % colorPalette.length]}" stroke="#FFFFFF" stroke-width="2">
            <animate attributeName="d" from="M ${centerX},${centerY} L ${centerX},${centerY - radius} A ${radius},${radius} 0 0,1 ${centerX},${centerY - radius} Z"
                     to="${path}" dur="1s" fill="freeze"/>
          </path>

          <!-- Legend -->
          <rect x="480" y="${legendY}" width="20" height="20" fill="${colorPalette[i % colorPalette.length]}" rx="4"/>
          <text x="510" y="${legendY + 15}" font-size="14" fill="${colors.textColor}">${slice.label}: ${slice.value}%</text>
        `;
      }).join('');

      return `
        <svg viewBox="0 0 700 400" xmlns="http://www.w3.org/2000/svg">
          <rect width="700" height="400" fill="${colors.backgroundColor}" rx="8"/>

          ${title ? `<text x="350" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="${colors.textColor}">${title}</text>` : ''}

          ${slicePaths}
        </svg>
      `;
    }
  },

  {
    id: 'stat-cards-3',
    type: 'stat-card',
    name: 'Stat Cards (3 cards)',
    description: 'Display 3 key metrics with icons',
    dataStructure: {
      stats: {
        type: 'array',
        required: true,
        example: [
          { value: '95%', label: 'Success Rate', icon: 'check' },
          { value: '10x', label: 'ROI', icon: 'growth' },
          { value: '24/7', label: 'Support', icon: 'support' }
        ]
      }
    },
    styling: {
      primaryColor: '#2563EB',
      secondaryColor: '#7C3AED',
      accentColor: '#F59E0B',
      textColor: '#1F2937',
      backgroundColor: '#FFFFFF'
    },
    generate: (data, colors) => {
      const { stats } = data;
      const colorPalette = [colors.primaryColor, colors.secondaryColor, colors.accentColor];

      return `
        <svg viewBox="0 0 800 300" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="300" fill="${colors.backgroundColor}"/>

          ${stats.map((stat: any, i: number) => {
            const cardX = 50 + (i * 250);
            const cardColor = colorPalette[i % 3];

            return `
              <!-- Card ${i + 1} -->
              <rect x="${cardX}" y="30" width="220" height="240" fill="${cardColor}" rx="12" opacity="0.1"/>
              <rect x="${cardX}" y="30" width="220" height="240" fill="none" stroke="${cardColor}" stroke-width="3" rx="12"/>

              <!-- Icon placeholder -->
              <circle cx="${cardX + 110}" cy="100" r="35" fill="${cardColor}" opacity="0.2"/>
              <circle cx="${cardX + 110}" cy="100" r="25" fill="${cardColor}"/>

              <!-- Value -->
              <text x="${cardX + 110}" y="190" text-anchor="middle" font-size="48" font-weight="bold" fill="${cardColor}">${stat.value}</text>

              <!-- Label -->
              <text x="${cardX + 110}" y="235" text-anchor="middle" font-size="16" font-weight="600" fill="${colors.textColor}">${stat.label}</text>
            `;
          }).join('')}
        </svg>
      `;
    }
  },

  {
    id: 'process-flow-4',
    type: 'process-flow',
    name: 'Process Flow (4 steps)',
    description: 'Show sequential process with arrows',
    dataStructure: {
      steps: {
        type: 'array',
        required: true,
        example: [
          { number: 1, title: 'Discover', description: 'Identify needs' },
          { number: 2, title: 'Design', description: 'Create solution' },
          { number: 3, title: 'Develop', description: 'Build product' },
          { number: 4, title: 'Deploy', description: 'Launch to users' }
        ]
      }
    },
    styling: {
      primaryColor: '#2563EB',
      secondaryColor: '#7C3AED',
      accentColor: '#F59E0B',
      textColor: '#1F2937',
      backgroundColor: '#FFFFFF'
    },
    generate: (data, colors) => {
      const { steps } = data;

      return `
        <svg viewBox="0 0 900 300" xmlns="http://www.w3.org/2000/svg">
          <rect width="900" height="300" fill="${colors.backgroundColor}"/>

          ${steps.map((step: any, i: number) => {
            const stepX = 50 + (i * 210);

            return `
              <!-- Step ${i + 1} -->
              <circle cx="${stepX}" cy="100" r="40" fill="${colors.primaryColor}">
                <animate attributeName="r" from="0" to="40" dur="0.5s" begin="${i * 0.2}s" fill="freeze"/>
              </circle>
              <text x="${stepX}" y="110" text-anchor="middle" font-size="28" font-weight="bold" fill="#FFFFFF">${step.number}</text>

              <text x="${stepX}" y="170" text-anchor="middle" font-size="18" font-weight="bold" fill="${colors.textColor}">${step.title}</text>
              <text x="${stepX}" y="195" text-anchor="middle" font-size="14" fill="${colors.textColor}" opacity="0.7">${step.description}</text>

              ${i < steps.length - 1 ? `
                <!-- Arrow -->
                <line x1="${stepX + 45}" y1="100" x2="${stepX + 155}" y2="100" stroke="${colors.primaryColor}" stroke-width="3" opacity="0.3"/>
                <polygon points="${stepX + 155},100 ${stepX + 145},95 ${stepX + 145},105" fill="${colors.primaryColor}" opacity="0.3"/>
              ` : ''}
            `;
          }).join('')}
        </svg>
      `;
    }
  },

  {
    id: 'comparison-bars',
    type: 'comparison-bars',
    name: 'Before/After Comparison',
    description: 'Show improvement with side-by-side bars',
    dataStructure: {
      comparisons: {
        type: 'array',
        required: true,
        example: [
          { metric: 'Response Time', before: 45, after: 95 },
          { metric: 'Customer Satisfaction', before: 60, after: 92 },
          { metric: 'Efficiency', before: 50, after: 88 }
        ]
      }
    },
    styling: {
      primaryColor: '#2563EB',
      secondaryColor: '#7C3AED',
      accentColor: '#F59E0B',
      textColor: '#1F2937',
      backgroundColor: '#FFFFFF'
    },
    generate: (data, colors) => {
      const { comparisons } = data;

      return `
        <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
          <rect width="600" height="400" fill="${colors.backgroundColor}" rx="8"/>

          <!-- Legend -->
          <rect x="200" y="30" width="20" height="20" fill="#EF4444" rx="4"/>
          <text x="230" y="45" font-size="14" font-weight="600" fill="${colors.textColor}">Before</text>

          <rect x="320" y="30" width="20" height="20" fill="${colors.primaryColor}" rx="4"/>
          <text x="350" y="45" font-size="14" font-weight="600" fill="${colors.textColor}">After</text>

          ${comparisons.map((comp: any, i: number) => {
            const rowY = 80 + (i * 90);

            return `
              <!-- Metric label -->
              <text x="50" y="${rowY + 30}" font-size="14" font-weight="600" fill="${colors.textColor}">${comp.metric}</text>

              <!-- Before bar -->
              <rect x="200" y="${rowY}" width="${comp.before * 3}" height="30" fill="#EF4444" rx="4" opacity="0.7">
                <animate attributeName="width" from="0" to="${comp.before * 3}" dur="0.8s" fill="freeze"/>
              </rect>
              <text x="${205 + comp.before * 3}" y="${rowY + 20}" font-size="14" font-weight="bold" fill="#EF4444">${comp.before}%</text>

              <!-- After bar -->
              <rect x="200" y="${rowY + 40}" width="${comp.after * 3}" height="30" fill="${colors.primaryColor}" rx="4">
                <animate attributeName="width" from="0" to="${comp.after * 3}" dur="0.8s" begin="0.2s" fill="freeze"/>
              </rect>
              <text x="${205 + comp.after * 3}" y="${rowY + 60}" font-size="14" font-weight="bold" fill="${colors.primaryColor}">${comp.after}%</text>
            `;
          }).join('')}
        </svg>
      `;
    }
  }
];

/**
 * Apply brand colors to infographic
 */
export function generateInfographic(
  templateId: string,
  data: any,
  brandColors: { primary: string; secondary: string; accent: string; text?: string; background?: string }
): string {
  const template = INFOGRAPHIC_TEMPLATES.find(t => t.id === templateId);

  if (!template) {
    throw new Error(`Infographic template ${templateId} not found`);
  }

  const colors = {
    primaryColor: brandColors.primary,
    secondaryColor: brandColors.secondary,
    accentColor: brandColors.accent,
    textColor: brandColors.text || '#1F2937',
    backgroundColor: brandColors.background || '#FFFFFF'
  };

  return template.generate(data, colors);
}

/**
 * Get template by type
 */
export function getInfographicTemplatesByType(type: InfographicType): InfographicTemplate[] {
  return INFOGRAPHIC_TEMPLATES.filter(t => t.type === type);
}
