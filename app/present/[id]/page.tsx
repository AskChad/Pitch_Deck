'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

interface Slide {
  id: string;
  type: 'title' | 'content' | 'image' | 'two-column';
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  leftContent?: string;
  rightContent?: string;
}

interface Deck {
  id: string;
  name: string;
  description: string;
  slides: Slide[];
  theme: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    fontFamily: string;
  };
}

export default function PresentationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const deckId = params.id as string;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [error, setError] = useState('');
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchDeck();
  }, [user, deckId]);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlideIndex, deck]);

  useEffect(() => {
    // Show/hide controls on mouse movement
    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const fetchDeck = async () => {
    try {
      const response = await fetch(`/api/decks/${deckId}`);
      if (!response.ok) throw new Error('Failed to fetch deck');

      const data = await response.json();
      setDeck(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load deck');
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (deck && currentSlideIndex < deck.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error || 'Deck not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = deck.slides[currentSlideIndex];

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Main Slide */}
      <div className="w-full h-screen flex items-center justify-center p-8">
        <div
          className="w-full max-w-7xl aspect-video rounded-lg shadow-2xl p-16 relative"
          style={{
            backgroundColor: deck.theme.colors.background,
            color: deck.theme.colors.text,
            fontFamily: deck.theme.fontFamily,
          }}
        >
          {currentSlide.type === 'title' && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <h1
                className="text-6xl lg:text-7xl font-bold mb-6 animate-fade-in"
                style={{ color: deck.theme.colors.primary }}
              >
                {currentSlide.title || 'Title'}
              </h1>
              {currentSlide.subtitle && (
                <p className="text-3xl lg:text-4xl text-gray-600 animate-fade-in-delay">
                  {currentSlide.subtitle}
                </p>
              )}
            </div>
          )}

          {currentSlide.type === 'content' && (
            <div className="h-full animate-fade-in">
              <h2
                className="text-5xl lg:text-6xl font-bold mb-8"
                style={{ color: deck.theme.colors.primary }}
              >
                {currentSlide.title || 'Title'}
              </h2>
              <div className="text-2xl lg:text-3xl whitespace-pre-wrap leading-relaxed">
                {currentSlide.content || 'Content'}
              </div>
            </div>
          )}

          {currentSlide.type === 'two-column' && (
            <div className="h-full flex flex-col animate-fade-in">
              <h2
                className="text-5xl lg:text-6xl font-bold mb-8"
                style={{ color: deck.theme.colors.primary }}
              >
                {currentSlide.title || 'Title'}
              </h2>
              <div className="flex gap-12 flex-1">
                <div className="flex-1 text-xl lg:text-2xl leading-relaxed">
                  {currentSlide.leftContent || 'Left column'}
                </div>
                <div className="flex-1 text-xl lg:text-2xl leading-relaxed">
                  {currentSlide.rightContent || 'Right column'}
                </div>
              </div>
            </div>
          )}

          {currentSlide.type === 'image' && (
            <div className="h-full flex flex-col animate-fade-in">
              <h2
                className="text-5xl lg:text-6xl font-bold mb-8"
                style={{ color: deck.theme.colors.primary }}
              >
                {currentSlide.title || 'Title'}
              </h2>
              <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                {currentSlide.imageUrl ? (
                  <img
                    src={currentSlide.imageUrl}
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
        </div>
      </div>

      {/* Controls */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Progress Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center gap-4">
              <span className="text-white text-sm font-medium whitespace-nowrap">
                {currentSlideIndex + 1} / {deck.slides.length}
              </span>
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{
                    width: `${((currentSlideIndex + 1) / deck.slides.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3 ml-6">
            <button
              onClick={prevSlide}
              disabled={currentSlideIndex === 0}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              ← Prev
            </button>

            <button
              onClick={toggleFullscreen}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? '⛶' : '⛶'}
            </button>

            <button
              onClick={nextSlide}
              disabled={currentSlideIndex === deck.slides.length - 1}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              Next →
            </button>

            <button
              onClick={() => router.push(`/editor/${deckId}`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg backdrop-blur-sm"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div
        className={`fixed top-4 right-4 bg-black/60 text-white text-xs p-3 rounded-lg backdrop-blur-sm transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="font-semibold mb-1">Keyboard Shortcuts:</div>
        <div>← → Arrow keys or Space to navigate</div>
        <div>F for fullscreen</div>
        <div>ESC to exit fullscreen</div>
      </div>

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
