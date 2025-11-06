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
  const [showRebuildModal, setShowRebuildModal] = useState(false);
  const [rebuildingWithAI, setRebuildingWithAI] = useState(false);

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

  const rebuildWithAI = async (generationData: any) => {
    if (!deck) return;

    setRebuildingWithAI(true);
    try {
      const formData = new FormData();
      formData.append('name', deck.name);
      formData.append('content', generationData.content);
      formData.append('instructions', generationData.instructions || '');
      formData.append('buildOnly', generationData.buildOnly ? 'true' : 'false');
      formData.append('fillMissingGraphics', generationData.fillMissingGraphics ? 'true' : 'false');
      formData.append('urls', JSON.stringify(generationData.urls || []));

      const response = await fetch('/api/ai/generate-deck', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rebuild deck');
      }

      const newDeckData = await response.json();

      // Update the current deck with the new data while preserving the ID
      const updateResponse = await fetch(`/api/decks/${deckId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeckData.name,
          description: newDeckData.description,
          slides: newDeckData.slides,
          theme: newDeckData.theme,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update deck');
      }

      // Refresh the deck
      await fetchDeck();
      setShowRebuildModal(false);
      alert('Deck successfully rebuilt with AI!');
    } catch (error: any) {
      console.error('Error rebuilding deck:', error);
      alert(error.message || 'Failed to rebuild deck with AI');
    } finally {
      setRebuildingWithAI(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error || 'Deck not found'}</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No Slides Found</h2>
          <p className="text-gray-300 mb-6">This deck has no slides. Let's add one!</p>
          <button
            onClick={() => addSlide('title')}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Add First Slide
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = deck.slides[currentSlideIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-300 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <input
              type="text"
              value={deck.name}
              onChange={(e) => setDeck({ ...deck, name: e.target.value })}
              className="text-xl font-bold bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-1 backdrop-blur-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRebuildModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
              title="Rebuild this deck with AI using the original inputs"
            >
              🔄 Rebuild with AI
            </button>
            <Link
              href={`/present/${deckId}`}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
              target="_blank"
            >
              Present
            </Link>
            <button
              onClick={saveDeck}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-lg"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      {/* Rebuild Modal */}
      {showRebuildModal && (deck as any).ai_generation_data && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">Rebuild Deck with AI</h2>
              <p className="text-gray-300 mt-2">
                Review and edit the original inputs, then rebuild your deck with AI.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Content
                </label>
                <textarea
                  defaultValue={(deck as any).ai_generation_data.content}
                  id="rebuild-content"
                  rows={8}
                  className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                  placeholder="Enter your pitch deck content..."
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Instructions (Optional)
                </label>
                <textarea
                  defaultValue={(deck as any).ai_generation_data.instructions}
                  id="rebuild-instructions"
                  rows={4}
                  className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                  placeholder="Any specific instructions for the AI..."
                />
              </div>

              {/* URLs */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Reference URLs
                </label>
                <input
                  type="text"
                  defaultValue={(deck as any).ai_generation_data.urls?.join(', ')}
                  id="rebuild-urls"
                  className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
                  placeholder="https://example.com, https://another.com"
                />
              </div>

              {/* Options */}
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={(deck as any).ai_generation_data.buildOnly}
                    id="rebuild-buildOnly"
                    className="mr-2 w-4 h-4 rounded border-white/20 bg-white/10 text-purple-600"
                  />
                  <span className="text-sm text-gray-300">Build Only (use exact content)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={(deck as any).ai_generation_data.fillMissingGraphics}
                    id="rebuild-fillGraphics"
                    className="mr-2 w-4 h-4 rounded border-white/20 bg-white/10 text-purple-600"
                  />
                  <span className="text-sm text-gray-300">Fill Missing Graphics</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowRebuildModal(false)}
                className="px-6 py-2 border-2 border-white/20 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const content = (document.getElementById('rebuild-content') as HTMLTextAreaElement).value;
                  const instructions = (document.getElementById('rebuild-instructions') as HTMLTextAreaElement).value;
                  const urlsText = (document.getElementById('rebuild-urls') as HTMLInputElement).value;
                  const urls = urlsText ? urlsText.split(',').map(u => u.trim()).filter(Boolean) : [];
                  const buildOnly = (document.getElementById('rebuild-buildOnly') as HTMLInputElement).checked;
                  const fillMissingGraphics = (document.getElementById('rebuild-fillGraphics') as HTMLInputElement).checked;

                  rebuildWithAI({
                    content,
                    instructions,
                    urls,
                    buildOnly,
                    fillMissingGraphics,
                  });
                }}
                disabled={rebuildingWithAI}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all shadow-lg"
              >
                {rebuildingWithAI ? 'Rebuilding...' : '🔄 Rebuild Deck'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No AI Data Warning Modal */}
      {showRebuildModal && !(deck as any).ai_generation_data && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">⚠️ No AI Data Available</h2>
            <p className="text-gray-300 mb-6">
              This deck wasn't created with AI, so there's no original input data to rebuild from.
            </p>
            <p className="text-gray-400 mb-6">
              You can create a new AI-generated deck from the dashboard using the "Create with AI" button.
            </p>
            <button
              onClick={() => setShowRebuildModal(false)}
              className="w-full px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
            >
              Got it
            </button>
          </div>
        </div>
      )}

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
