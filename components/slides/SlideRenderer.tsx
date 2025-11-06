'use client';

import React from 'react';

export interface SlideData {
  id: string;
  type: 'title' | 'content' | 'split' | 'stats' | 'image-focus' | 'two-column' | 'image';
  layout?: string;
  background?: 'gradient' | 'solid' | 'pattern' | 'image';
  title?: string;
  subtitle?: string;
  content?: string;
  leftContent?: string;
  rightContent?: string;
  mainStat?: string;
  statLabel?: string;
  supportingStats?: string;
  imageUrl?: string;
  graphic?: {
    type: 'image' | 'icon';
    prompt: string;
    position: 'background' | 'center' | 'side' | 'left' | 'right';
  };
}

export interface SlideTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fontFamily: string;
}

interface SlideRendererProps {
  slide: SlideData;
  theme: SlideTheme;
  className?: string;
}

export function SlideRenderer({ slide, theme, className = '' }: SlideRendererProps) {

  // Generate background style based on slide background type
  const getBackgroundStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: theme.fontFamily,
    };

    switch (slide.background) {
      case 'gradient':
        return {
          ...baseStyle,
          background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
          color: '#ffffff',
        };
      case 'pattern':
        return {
          ...baseStyle,
          backgroundImage: `
            linear-gradient(30deg, ${theme.colors.primary}08 12%, transparent 12.5%, transparent 87%, ${theme.colors.primary}08 87.5%, ${theme.colors.primary}08),
            linear-gradient(150deg, ${theme.colors.primary}08 12%, transparent 12.5%, transparent 87%, ${theme.colors.primary}08 87.5%, ${theme.colors.primary}08),
            linear-gradient(30deg, ${theme.colors.primary}08 12%, transparent 12.5%, transparent 87%, ${theme.colors.primary}08 87.5%, ${theme.colors.primary}08),
            linear-gradient(150deg, ${theme.colors.primary}08 12%, transparent 12.5%, transparent 87%, ${theme.colors.primary}08 87.5%, ${theme.colors.primary}08),
            linear-gradient(60deg, ${theme.colors.secondary}08 25%, transparent 25.5%, transparent 75%, ${theme.colors.secondary}08 75%, ${theme.colors.secondary}08),
            linear-gradient(60deg, ${theme.colors.secondary}08 25%, transparent 25.5%, transparent 75%, ${theme.colors.secondary}08 75%, ${theme.colors.secondary}08)
          `,
          backgroundSize: '80px 140px',
          backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px',
        };
      case 'image':
        if (slide.imageUrl && slide.graphic?.position === 'background') {
          return {
            ...baseStyle,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${slide.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#ffffff',
          };
        }
        return baseStyle;
      default:
        return baseStyle;
    }
  };

  // Format content with bullet points
  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;

      // Check if line starts with bullet point
      const hasBullet = trimmedLine.startsWith('•') || trimmedLine.startsWith('-');
      const text = hasBullet ? trimmedLine.substring(1).trim() : trimmedLine;

      return (
        <div key={index} className="flex items-start gap-3 mb-4">
          {hasBullet && (
            <span className="text-2xl lg:text-3xl mt-1" style={{ color: theme.colors.accent }}>
              •
            </span>
          )}
          <span className={`text-2xl lg:text-3xl ${!hasBullet ? 'ml-0' : ''}`}>
            {text}
          </span>
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <div
      className={`w-full h-full rounded-lg shadow-2xl p-12 lg:p-16 relative overflow-hidden ${className}`}
      style={getBackgroundStyle()}
    >
      {/* Title Slide */}
      {slide.type === 'title' && (
        <div className="h-full flex flex-col items-center justify-center text-center relative z-10">
          {slide.imageUrl && slide.graphic?.position === 'background' && (
            <div className="absolute inset-0 opacity-10">
              <img src={slide.imageUrl} alt="" className="w-full h-full object-contain" />
            </div>
          )}
          <h1 className="text-6xl lg:text-8xl font-bold mb-6 animate-fade-in drop-shadow-lg">
            {slide.title || 'Title'}
          </h1>
          {slide.subtitle && (
            <p className="text-3xl lg:text-5xl opacity-90 animate-fade-in-delay drop-shadow">
              {slide.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Content Slide */}
      {slide.type === 'content' && (
        <div className="h-full flex flex-col animate-fade-in">
          <h2
            className="text-4xl lg:text-6xl font-bold mb-8 pb-4 border-b-4"
            style={{ borderColor: theme.colors.accent, color: theme.colors.primary }}
          >
            {slide.title || 'Title'}
          </h2>
          <div className="flex-1 flex gap-8">
            <div className={slide.imageUrl && slide.graphic?.position === 'side' ? 'flex-1' : 'w-full'}>
              <div className="leading-relaxed">
                {formatContent(slide.content || 'Content')}
              </div>
            </div>
            {slide.imageUrl && slide.graphic?.position === 'side' && (
              <div className="flex-1 flex items-center justify-center">
                <img
                  src={slide.imageUrl}
                  alt="Visual"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Split Slide (Text + Image) */}
      {slide.type === 'split' && (
        <div className="h-full flex flex-col animate-fade-in">
          {slide.title && (
            <h2
              className="text-4xl lg:text-6xl font-bold mb-8 pb-4 border-b-4"
              style={{ borderColor: theme.colors.accent, color: theme.colors.primary }}
            >
              {slide.title}
            </h2>
          )}
          <div className="flex-1 flex gap-12">
            <div className={slide.layout === '60-40' ? 'w-3/5' : 'flex-1'}>
              <div className="leading-relaxed">
                {formatContent(slide.leftContent || '')}
              </div>
            </div>
            <div className={slide.layout === '60-40' ? 'w-2/5' : 'flex-1'}>
              {slide.imageUrl ? (
                <img
                  src={slide.imageUrl}
                  alt="Visual"
                  className="w-full h-full object-contain rounded-lg shadow-xl"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🖼️</div>
                    <div className="text-xl">Graphic will appear here</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Slide */}
      {slide.type === 'stats' && (
        <div className="h-full flex flex-col items-center justify-center text-center relative z-10">
          {slide.imageUrl && slide.graphic?.position === 'background' && (
            <div className="absolute inset-0 opacity-10">
              <img src={slide.imageUrl} alt="" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="animate-fade-in">
            <div className="text-9xl lg:text-[12rem] font-bold mb-4 drop-shadow-lg" style={{ color: theme.colors.accent }}>
              {slide.mainStat || '0'}
            </div>
            <div className="text-4xl lg:text-6xl font-semibold mb-8 drop-shadow">
              {slide.statLabel || 'Metric'}
            </div>
            {slide.supportingStats && (
              <div className="text-2xl lg:text-3xl opacity-90 drop-shadow">
                {slide.supportingStats}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Focus Slide */}
      {slide.type === 'image-focus' && (
        <div className="h-full flex flex-col animate-fade-in">
          {slide.title && (
            <h2
              className="text-4xl lg:text-6xl font-bold mb-8 pb-4 border-b-4"
              style={{ borderColor: theme.colors.accent, color: theme.colors.primary }}
            >
              {slide.title}
            </h2>
          )}
          <div className="flex-1 flex items-center justify-center p-4">
            {slide.imageUrl ? (
              <img
                src={slide.imageUrl}
                alt={slide.title || 'Visual'}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-8xl mb-4">📊</div>
                  <div className="text-3xl">Infographic will appear here</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legacy Two-Column Slide */}
      {slide.type === 'two-column' && (
        <div className="h-full flex flex-col animate-fade-in">
          {slide.title && (
            <h2
              className="text-4xl lg:text-6xl font-bold mb-8 pb-4 border-b-4"
              style={{ borderColor: theme.colors.accent, color: theme.colors.primary }}
            >
              {slide.title}
            </h2>
          )}
          <div className="flex-1 flex gap-12">
            <div className="flex-1 text-xl lg:text-2xl leading-relaxed">
              {formatContent(slide.leftContent || 'Left column')}
            </div>
            <div className="flex-1 text-xl lg:text-2xl leading-relaxed">
              {formatContent(slide.rightContent || 'Right column')}
            </div>
          </div>
        </div>
      )}

      {/* Legacy Image Slide */}
      {slide.type === 'image' && (
        <div className="h-full flex flex-col animate-fade-in">
          {slide.title && (
            <h2
              className="text-4xl lg:text-6xl font-bold mb-8 pb-4 border-b-4"
              style={{ borderColor: theme.colors.accent, color: theme.colors.primary }}
            >
              {slide.title}
            </h2>
          )}
          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
            {slide.imageUrl ? (
              <img
                src={slide.imageUrl}
                alt="Slide"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-center text-2xl">
                <div className="text-6xl mb-4">🖼️</div>
                <div>No image set</div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.5s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
}
