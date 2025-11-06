'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { SlideRenderer, SlideData, SlideTheme } from '@/components/slides/SlideRenderer';

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

      // Ensure deck has at least one slide
      if (!data.slides || data.slides.length === 0) {
        data.slides = [{
          id: `slide-${Date.now()}`,
          type: 'title',
          title: 'Welcome to Your Pitch Deck',
          subtitle: 'No slides yet - edit this deck to add content',
        }];
      }

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

  // Safety check for slides
  if (!deck.slides || deck.slides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Slides to Present</h2>
          <p className="text-gray-700 mb-6">This deck has no slides yet.</p>
          <button
            onClick={() => router.push(`/editor/${deckId}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Editor
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = deck.slides[currentSlideIndex] as SlideData;

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Main Slide */}
      <div className="w-full h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-7xl aspect-video">
          <SlideRenderer
            slide={currentSlide}
            theme={deck.theme as SlideTheme}
          />
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

            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg backdrop-blur-sm"
            >
              Exit
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
    </div>
  );
}
