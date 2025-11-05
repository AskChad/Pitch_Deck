import { create } from 'zustand';
import { PitchDeck, Slide, SlideElement } from '@/types/deck';

interface DeckState {
  currentDeck: PitchDeck | null;
  selectedSlideId: string | null;
  selectedElementId: string | null;
  isGenerating: boolean;

  // Actions
  setCurrentDeck: (deck: PitchDeck) => void;
  updateDeck: (updates: Partial<PitchDeck>) => void;
  addSlide: (slide: Slide) => void;
  updateSlide: (slideId: string, updates: Partial<Slide>) => void;
  deleteSlide: (slideId: string) => void;
  reorderSlides: (startIndex: number, endIndex: number) => void;

  addElement: (slideId: string, element: SlideElement) => void;
  updateElement: (slideId: string, elementId: string, updates: Partial<SlideElement>) => void;
  deleteElement: (slideId: string, elementId: string) => void;

  selectSlide: (slideId: string | null) => void;
  selectElement: (elementId: string | null) => void;

  setGenerating: (isGenerating: boolean) => void;

  // Brand extraction
  extractBrandAssets: (url: string) => Promise<void>;

  // AI Generation
  generateSlideBackground: (slideId: string, description: string) => Promise<void>;
  generateIcon: (slideId: string, concept: string) => Promise<void>;
}

export const useDeckStore = create<DeckState>((set, get) => ({
  currentDeck: null,
  selectedSlideId: null,
  selectedElementId: null,
  isGenerating: false,

  setCurrentDeck: (deck) => set({ currentDeck: deck }),

  updateDeck: (updates) =>
    set((state) => ({
      currentDeck: state.currentDeck
        ? { ...state.currentDeck, ...updates, updatedAt: new Date().toISOString() }
        : null,
    })),

  addSlide: (slide) =>
    set((state) => ({
      currentDeck: state.currentDeck
        ? {
            ...state.currentDeck,
            slides: [...state.currentDeck.slides, slide],
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  updateSlide: (slideId, updates) =>
    set((state) => ({
      currentDeck: state.currentDeck
        ? {
            ...state.currentDeck,
            slides: state.currentDeck.slides.map((slide) =>
              slide.id === slideId ? { ...slide, ...updates } : slide
            ),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  deleteSlide: (slideId) =>
    set((state) => ({
      currentDeck: state.currentDeck
        ? {
            ...state.currentDeck,
            slides: state.currentDeck.slides.filter((slide) => slide.id !== slideId),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  reorderSlides: (startIndex, endIndex) =>
    set((state) => {
      if (!state.currentDeck) return state;

      const slides = [...state.currentDeck.slides];
      const [removed] = slides.splice(startIndex, 1);
      slides.splice(endIndex, 0, removed);

      return {
        currentDeck: {
          ...state.currentDeck,
          slides,
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  addElement: (slideId, element) =>
    set((state) => ({
      currentDeck: state.currentDeck
        ? {
            ...state.currentDeck,
            slides: state.currentDeck.slides.map((slide) =>
              slide.id === slideId
                ? { ...slide, elements: [...slide.elements, element] }
                : slide
            ),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  updateElement: (slideId, elementId, updates) =>
    set((state) => ({
      currentDeck: state.currentDeck
        ? {
            ...state.currentDeck,
            slides: state.currentDeck.slides.map((slide) =>
              slide.id === slideId
                ? {
                    ...slide,
                    elements: slide.elements.map((element) =>
                      element.id === elementId ? { ...element, ...updates } : element
                    ),
                  }
                : slide
            ),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  deleteElement: (slideId, elementId) =>
    set((state) => ({
      currentDeck: state.currentDeck
        ? {
            ...state.currentDeck,
            slides: state.currentDeck.slides.map((slide) =>
              slide.id === slideId
                ? {
                    ...slide,
                    elements: slide.elements.filter((element) => element.id !== elementId),
                  }
                : slide
            ),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  selectSlide: (slideId) => set({ selectedSlideId: slideId }),

  selectElement: (elementId) => set({ selectedElementId: elementId }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  extractBrandAssets: async (url) => {
    try {
      set({ isGenerating: true });

      const response = await fetch('/api/brand-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract brand assets');
      }

      const brandAssets = await response.json();

      set((state) => ({
        currentDeck: state.currentDeck
          ? {
              ...state.currentDeck,
              brandUrl: url,
              brandAssets,
              theme: {
                ...state.currentDeck.theme,
                colors: brandAssets.colors,
              },
              updatedAt: new Date().toISOString(),
            }
          : null,
        isGenerating: false,
      }));
    } catch (error) {
      console.error('Brand extraction error:', error);
      set({ isGenerating: false });
      throw error;
    }
  },

  generateSlideBackground: async (slideId, description) => {
    try {
      set({ isGenerating: true });

      const state = get();
      const brandColors = state.currentDeck?.theme.colors
        ? Object.values(state.currentDeck.theme.colors)
        : undefined;

      const response = await fetch('/api/leonardo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: description,
          type: 'background',
          brandColors,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate background');
      }

      const { imageUrl } = await response.json();

      get().updateSlide(slideId, {
        background: {
          image: imageUrl,
        },
      });

      set({ isGenerating: false });
    } catch (error) {
      console.error('Background generation error:', error);
      set({ isGenerating: false });
      throw error;
    }
  },

  generateIcon: async (slideId, concept) => {
    try {
      set({ isGenerating: true });

      const state = get();
      const brandColor = state.currentDeck?.theme.colors.primary;

      const response = await fetch('/api/iconkit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: concept,
          style: 'line',
          color: brandColor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate icon');
      }

      const icon = await response.json();

      // Add icon as element to slide
      const newElement: SlideElement = {
        id: `element-${Date.now()}`,
        type: 'icon',
        content: icon.svg || icon.url,
        position: { x: 50, y: 50 },
        size: { width: 10, height: 10 },
        animation: {
          type: 'zoom',
          duration: 0.5,
          delay: 0,
        },
      };

      get().addElement(slideId, newElement);

      set({ isGenerating: false });
    } catch (error) {
      console.error('Icon generation error:', error);
      set({ isGenerating: false });
      throw error;
    }
  },
}));
