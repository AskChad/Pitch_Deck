'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
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

export default function EditorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const deckId = params.id as string;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchDeck();
  }, [user, deckId]);

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
          subtitle: 'Click to edit and start creating',
        }];
      }

      setDeck(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load deck');
      setLoading(false);
    }
  };

  const saveDeck = async () => {
    if (!deck) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deck.name,
          description: deck.description,
          slides: deck.slides,
          theme: deck.theme,
        }),
      });

      if (!response.ok) throw new Error('Failed to save deck');

      setTimeout(() => setSaving(false), 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to save deck');
      setSaving(false);
    }
  };

  const addSlide = (type: Slide['type'] = 'content') => {
    if (!deck) return;

    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      type,
      title: 'New Slide',
      content: 'Click to edit content',
    };

    setDeck({
      ...deck,
      slides: [...deck.slides, newSlide],
    });
    setCurrentSlideIndex(deck.slides.length);
  };

  const deleteSlide = (index: number) => {
    if (!deck || deck.slides.length <= 1) return;

    const newSlides = deck.slides.filter((_, i) => i !== index);
    setDeck({ ...deck, slides: newSlides });

    if (currentSlideIndex >= newSlides.length) {
      setCurrentSlideIndex(newSlides.length - 1);
    }
  };

  const updateSlide = (index: number, updates: Partial<Slide>) => {
    if (!deck) return;

    const newSlides = [...deck.slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    setDeck({ ...deck, slides: newSlides });
  };

  const moveSlide = (fromIndex: number, toIndex: number) => {
    if (!deck) return;

    const newSlides = [...deck.slides];
    const [moved] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, moved);

    setDeck({ ...deck, slides: newSlides });
    setCurrentSlideIndex(toIndex);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error || 'Deck not found'}</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Safety check for slides
  if (!deck.slides || deck.slides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Slides Found</h2>
          <p className="text-gray-700 mb-6">This deck has no slides. Let's add one!</p>
          <button
            onClick={() => addSlide('title')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add First Slide
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = deck.slides[currentSlideIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </Link>
            <input
              type="text"
              value={deck.name}
              onChange={(e) => setDeck({ ...deck, name: e.target.value })}
              className="text-xl font-bold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/present/${deckId}`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              target="_blank"
            >
              Present
            </Link>
            <button
              onClick={saveDeck}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Slide List */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => addSlide('content')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Add Slide
            </button>
          </div>

          <div className="p-2">
            {deck.slides.map((slide, index) => (
              <div
                key={slide.id}
                onClick={() => setCurrentSlideIndex(index)}
                className={`p-3 mb-2 rounded-lg cursor-pointer border-2 transition-colors ${
                  index === currentSlideIndex
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-500">
                    Slide {index + 1}
                  </span>
                  {deck.slides.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(index);
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {slide.title || 'Untitled'}
                </div>
                <div className="text-xs text-gray-500 capitalize">{slide.type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Slide Preview */}
            <div className="aspect-video mb-8">
              <SlideRenderer
                slide={currentSlide as SlideData}
                theme={deck.theme as SlideTheme}
              />
            </div>

            {/* Slide Properties */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Slide Properties</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slide Type
                  </label>
                  <select
                    value={currentSlide.type}
                    onChange={(e) => updateSlide(currentSlideIndex, { type: e.target.value as Slide['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="title">Title Slide</option>
                    <option value="content">Content Slide</option>
                    <option value="two-column">Two Column</option>
                    <option value="image">Image Slide</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={currentSlide.title || ''}
                    onChange={(e) => updateSlide(currentSlideIndex, { title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {currentSlide.type === 'title' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={currentSlide.subtitle || ''}
                      onChange={(e) => updateSlide(currentSlideIndex, { subtitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {currentSlide.type === 'content' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <textarea
                      value={currentSlide.content || ''}
                      onChange={(e) => updateSlide(currentSlideIndex, { content: e.target.value })}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {currentSlide.type === 'two-column' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Left Column
                      </label>
                      <textarea
                        value={currentSlide.leftContent || ''}
                        onChange={(e) => updateSlide(currentSlideIndex, { leftContent: e.target.value })}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Right Column
                      </label>
                      <textarea
                        value={currentSlide.rightContent || ''}
                        onChange={(e) => updateSlide(currentSlideIndex, { rightContent: e.target.value })}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {currentSlide.type === 'image' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={currentSlide.imageUrl || ''}
                      onChange={(e) => updateSlide(currentSlideIndex, { imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Slide Navigation */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => moveSlide(currentSlideIndex, Math.max(0, currentSlideIndex - 1))}
                    disabled={currentSlideIndex === 0}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    Move Up
                  </button>
                  <button
                    onClick={() => moveSlide(currentSlideIndex, Math.min(deck.slides.length - 1, currentSlideIndex + 1))}
                    disabled={currentSlideIndex === deck.slides.length - 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    Move Down
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
