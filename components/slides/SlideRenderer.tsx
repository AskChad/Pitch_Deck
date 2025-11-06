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
          background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primary}dd 50%, ${theme.colors.secondary} 100%)`,
          color: '#ffffff',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.1)',
        };
      case 'pattern':
        return {
          ...baseStyle,
          background: `${theme.colors.background}`,
          backgroundImage: `
            radial-gradient(circle at 20% 80%, ${theme.colors.primary}05 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${theme.colors.secondary}05 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, ${theme.colors.accent}03 0%, transparent 50%),
            linear-gradient(30deg, ${theme.colors.primary}06 12%, transparent 12.5%, transparent 87%, ${theme.colors.primary}06 87.5%, ${theme.colors.primary}06),
            linear-gradient(150deg, ${theme.colors.primary}06 12%, transparent 12.5%, transparent 87%, ${theme.colors.primary}06 87.5%, ${theme.colors.primary}06),
            linear-gradient(30deg, ${theme.colors.primary}06 12%, transparent 12.5%, transparent 87%, ${theme.colors.primary}06 87.5%, ${theme.colors.primary}06),
            linear-gradient(150deg, ${theme.colors.primary}06 12%, transparent 12.5%, transparent 87%, ${theme.colors.primary}06 87.5%, ${theme.colors.primary}06),
            linear-gradient(60deg, ${theme.colors.secondary}04 25%, transparent 25.5%, transparent 75%, ${theme.colors.secondary}04 75%, ${theme.colors.secondary}04),
            linear-gradient(60deg, ${theme.colors.secondary}04 25%, transparent 25.5%, transparent 75%, ${theme.colors.secondary}04 75%, ${theme.colors.secondary}04)
          `,
          backgroundSize: '100% 100%, 100% 100%, 100% 100%, 80px 140px, 80px 140px, 80px 140px, 80px 140px, 80px 140px, 80px 140px',
          backgroundPosition: '0 0, 0 0, 0 0, 0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px',
        };
      case 'image':
        if (slide.imageUrl && slide.graphic?.position === 'background') {
          return {
            ...baseStyle,
            backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.3)), url(${slide.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#ffffff',
          };
        }
        return baseStyle;
      default:
        return {
          ...baseStyle,
          background: `linear-gradient(to bottom right, ${theme.colors.background}, ${theme.colors.background}f0)`,
        };
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
      className={`w-full h-full rounded-xl shadow-2xl p-12 lg:p-16 relative overflow-hidden ${className}`}
      style={{
        ...getBackgroundStyle(),
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Title Slide */}
      {slide.type === 'title' && (
        <div className="h-full flex flex-col items-center justify-center text-center relative z-10">
          {/* Decorative accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-2 animate-slide-in"
            style={{ background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.secondary})` }}
          />

          {slide.imageUrl && slide.graphic?.position === 'background' && (
            <div className="absolute inset-0 opacity-10">
              <img src={slide.imageUrl} alt="" className="w-full h-full object-contain" />
            </div>
          )}

          <div className="relative">
            {/* Decorative shape behind title */}
            <div
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-32 h-32 rounded-full opacity-20 blur-3xl"
              style={{ backgroundColor: theme.colors.accent }}
            />

            <h1 className="text-7xl lg:text-9xl font-extrabold mb-8 animate-fade-in relative"
                style={{
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  letterSpacing: '-0.02em'
                }}>
              {slide.title || 'Title'}
            </h1>
          </div>

          {slide.subtitle && (
            <div className="relative max-w-4xl">
              <p className="text-3xl lg:text-5xl opacity-95 animate-fade-in-delay font-light leading-tight"
                 style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                {slide.subtitle}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Content Slide */}
      {slide.type === 'content' && (
        <div className="h-full flex flex-col animate-fade-in">
          <div className="relative mb-10">
            {/* Accent decoration */}
            <div
              className="absolute -left-4 top-0 bottom-0 w-1.5 rounded-full"
              style={{ backgroundColor: theme.colors.accent }}
            />
            <h2
              className="text-5xl lg:text-7xl font-bold pb-6 border-b-4"
              style={{
                borderColor: theme.colors.accent,
                color: theme.colors.primary,
                letterSpacing: '-0.01em'
              }}
            >
              {slide.title || 'Title'}
            </h2>
          </div>
          <div className="flex-1 flex gap-10">
            <div className={slide.imageUrl && slide.graphic?.position === 'side' ? 'flex-1' : 'w-full'}>
              <div className="leading-relaxed">
                {formatContent(slide.content || 'Content')}
              </div>
            </div>
            {slide.imageUrl && slide.graphic?.position === 'side' && (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="relative">
                  {/* Shadow decoration */}
                  <div className="absolute inset-0 rounded-xl blur-2xl opacity-30"
                       style={{ backgroundColor: theme.colors.primary }} />
                  <img
                    src={slide.imageUrl}
                    alt="Visual"
                    className="object-contain rounded-xl shadow-2xl relative z-10"
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      width: 'auto',
                      height: 'auto'
                    }}
                  />
                </div>
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
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={slide.imageUrl}
                    alt="Visual"
                    className="object-contain rounded-lg shadow-xl"
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      width: 'auto',
                      height: 'auto'
                    }}
                  />
                </div>
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
          {/* Decorative circles */}
          <div
            className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-10 blur-3xl animate-pulse-slow"
            style={{ backgroundColor: theme.colors.accent }}
          />
          <div
            className="absolute bottom-20 left-20 w-48 h-48 rounded-full opacity-10 blur-3xl animate-pulse-slow"
            style={{ backgroundColor: theme.colors.secondary, animationDelay: '1s' }}
          />

          {slide.imageUrl && slide.graphic?.position === 'background' && (
            <div className="absolute inset-0 opacity-10">
              <img src={slide.imageUrl} alt="" className="w-full h-full object-contain" />
            </div>
          )}

          <div className="animate-fade-in relative">
            {/* Stat container with background */}
            <div className="relative inline-block">
              <div
                className="absolute inset-0 rounded-3xl blur-xl opacity-30"
                style={{ backgroundColor: theme.colors.accent }}
              />
              <div className="text-9xl lg:text-[14rem] font-black mb-6 relative animate-scale-in"
                   style={{
                     color: theme.colors.accent,
                     textShadow: '0 10px 40px rgba(0,0,0,0.3)',
                     letterSpacing: '-0.02em'
                   }}>
                {slide.mainStat || '0'}
              </div>
            </div>

            <div className="text-5xl lg:text-7xl font-bold mb-10 animate-fade-in-delay"
                 style={{
                   textShadow: '0 4px 20px rgba(0,0,0,0.2)',
                   letterSpacing: '-0.01em'
                 }}>
              {slide.statLabel || 'Metric'}
            </div>

            {slide.supportingStats && (
              <div className="text-3xl lg:text-4xl opacity-90 font-light animate-fade-in-delay-2"
                   style={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
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
              className="text-3xl lg:text-5xl font-bold mb-6 text-center"
              style={{ color: theme.colors.primary }}
            >
              {slide.title}
            </h2>
          )}
          <div className="flex-1 flex items-center justify-center p-4">
            {slide.imageUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={slide.imageUrl}
                  alt={slide.title || 'Visual'}
                  className="object-contain"
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    width: 'auto',
                    height: 'auto'
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-400 border-4 border-dashed border-gray-300">
                <div className="text-center p-8">
                  <div className="text-8xl mb-4">📊</div>
                  <div className="text-3xl font-semibold">Infographic will appear here</div>
                  <div className="text-xl mt-2 text-gray-500">AI-generated visual based on content</div>
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
          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-4">
            {slide.imageUrl ? (
              <img
                src={slide.imageUrl}
                alt="Slide"
                className="object-contain"
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  width: 'auto',
                  height: 'auto'
                }}
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

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-in {
          from {
            transform: scaleX(0);
            transform-origin: left;
          }
          to {
            transform: scaleX(1);
            transform-origin: left;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.15;
            transform: scale(1.05);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.3s both;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 0.6s ease-out 0.5s both;
        }

        .animate-scale-in {
          animation: scale-in 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-slide-in {
          animation: slide-in 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
