'use client';

import { useState } from 'react';
import { PROFESSIONAL_TEMPLATES } from '@/lib/templates/slide-templates';
import { INFOGRAPHIC_TEMPLATES } from '@/lib/templates/infographic-templates';

export default function TemplatesPage() {
  const [selectedTab, setSelectedTab] = useState<'slides' | 'infographics'>('slides');
  const [brandColors, setBrandColors] = useState({
    primary: '#2563EB',
    secondary: '#7C3AED',
    accent: '#F59E0B'
  });

  // Sample data for infographic previews
  const sampleData = {
    'bar-chart-3': {
      bars: [
        { label: 'Before', value: 45 },
        { label: 'During', value: 72 },
        { label: 'After', value: 95 }
      ],
      title: 'Revenue Growth'
    },
    'pie-chart': {
      slices: [
        { label: 'Product A', value: 45 },
        { label: 'Product B', value: 30 },
        { label: 'Product C', value: 25 }
      ],
      title: 'Market Share'
    },
    'stat-cards-3': {
      stats: [
        { value: '95%', label: 'Success Rate', icon: 'check' },
        { value: '10x', label: 'ROI', icon: 'growth' },
        { value: '24/7', label: 'Support', icon: 'support' }
      ]
    },
    'process-flow-4': {
      steps: [
        { number: 1, title: 'Discover', description: 'Identify needs' },
        { number: 2, title: 'Design', description: 'Create solution' },
        { number: 3, title: 'Develop', description: 'Build product' },
        { number: 4, title: 'Deploy', description: 'Launch to users' }
      ]
    },
    'comparison-bars': {
      comparisons: [
        { metric: 'Response Time', before: 45, after: 95 },
        { metric: 'Customer Satisfaction', before: 60, after: 92 },
        { metric: 'Efficiency', before: 50, after: 88 }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Template Library</h1>
          <p className="text-gray-600">
            Pre-designed templates that AI fills with your content. All templates use your brand colors automatically.
          </p>
        </div>

        {/* Brand Color Picker */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview with Your Brand Colors</h2>
          <div className="flex gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <input
                type="color"
                value={brandColors.primary}
                onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                className="h-10 w-20 rounded cursor-pointer"
              />
              <span className="block text-xs text-gray-500 mt-1">{brandColors.primary}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <input
                type="color"
                value={brandColors.secondary}
                onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                className="h-10 w-20 rounded cursor-pointer"
              />
              <span className="block text-xs text-gray-500 mt-1">{brandColors.secondary}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
              <input
                type="color"
                value={brandColors.accent}
                onChange={(e) => setBrandColors({ ...brandColors, accent: e.target.value })}
                className="h-10 w-20 rounded cursor-pointer"
              />
              <span className="block text-xs text-gray-500 mt-1">{brandColors.accent}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('slides')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'slides'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Slide Templates ({PROFESSIONAL_TEMPLATES.length})
            </button>
            <button
              onClick={() => setSelectedTab('infographics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'infographics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Infographic Templates ({INFOGRAPHIC_TEMPLATES.length})
            </button>
          </nav>
        </div>

        {/* Slide Templates */}
        {selectedTab === 'slides' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PROFESSIONAL_TEMPLATES.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Template Info */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {template.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Layout: <span className="font-medium">{template.layout.structure}</span>
                  </p>
                </div>

                {/* Template Preview */}
                <div className="p-8 bg-gray-50">
                  <div
                    className="aspect-video rounded-lg shadow-lg relative overflow-hidden"
                    style={{
                      backgroundColor: template.styling.backgroundColor.replace('#2563EB', brandColors.primary),
                      color: template.styling.textColor
                    }}
                  >
                    {/* Content zones visualization */}
                    {template.layout.zones.map((zone) => (
                      <div
                        key={zone.id}
                        className="absolute border-2 border-dashed border-blue-400 bg-blue-50/50 flex items-center justify-center"
                        style={{
                          left: `${zone.x}%`,
                          top: `${zone.y}%`,
                          width: `${zone.width}%`,
                          height: `${zone.height}%`
                        }}
                      >
                        <span className="text-xs font-medium text-blue-600 bg-white/90 px-2 py-1 rounded">
                          {zone.id}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content Slots */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">AI Fills:</h4>
                  <div className="space-y-1">
                    {template.contentSlots.headline && (
                      <div className="text-xs text-gray-600">
                        • Headline (max {template.contentSlots.headline.maxLength} chars)
                        {template.contentSlots.headline.required && <span className="text-red-500">*</span>}
                      </div>
                    )}
                    {template.contentSlots.subheadline && (
                      <div className="text-xs text-gray-600">
                        • Subheadline (max {template.contentSlots.subheadline.maxLength} chars)
                      </div>
                    )}
                    {template.contentSlots.body && (
                      <div className="text-xs text-gray-600">
                        • Body text (max {template.contentSlots.body.maxLength} chars)
                      </div>
                    )}
                    {template.contentSlots.bulletPoints && (
                      <div className="text-xs text-gray-600">
                        • Bullet points ({template.contentSlots.bulletPoints.maxItems} max)
                      </div>
                    )}
                    {template.contentSlots.stats && (
                      <div className="text-xs text-gray-600">
                        • Stats ({template.contentSlots.stats.count} numbers)
                      </div>
                    )}
                    {template.contentSlots.image && (
                      <div className="text-xs text-gray-600">
                        • Image ({template.contentSlots.image.type})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infographic Templates */}
        {selectedTab === 'infographics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {INFOGRAPHIC_TEMPLATES.map((template) => {
              const data = sampleData[template.id as keyof typeof sampleData];
              const colors = {
                primaryColor: brandColors.primary,
                secondaryColor: brandColors.secondary,
                accentColor: brandColors.accent,
                textColor: '#1F2937',
                backgroundColor: '#FFFFFF'
              };
              const svgString = template.generate(data, colors);

              return (
                <div key={template.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Template Info */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                        {template.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>

                  {/* Infographic Preview */}
                  <div className="p-8 bg-gray-50">
                    <div
                      className="rounded-lg shadow-lg overflow-hidden bg-white"
                      dangerouslySetInnerHTML={{ __html: svgString }}
                    />
                  </div>

                  {/* Data Requirements */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Data Required:</h4>
                    <div className="space-y-1">
                      {Object.entries(template.dataStructure).map(([key, value]) => (
                        <div key={key} className="text-xs text-gray-600">
                          • <span className="font-medium">{key}</span>: {value.type}
                          {value.required && <span className="text-red-500">*</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
