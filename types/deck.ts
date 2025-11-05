export type SlideType =
  | 'title'
  | 'content'
  | 'image'
  | 'split'
  | 'quote'
  | 'timeline'
  | 'team'
  | 'metrics'
  | 'closing';

export type AnimationType =
  | 'fade'
  | 'slide'
  | 'zoom'
  | 'flip'
  | 'rotate'
  | 'bounce'
  | 'none';

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface BrandAssets {
  logo?: string;
  favicon?: string;
  images: string[];
  colors: BrandColors;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'icon' | 'shape';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
  };
  animation?: {
    type: AnimationType;
    duration: number;
    delay: number;
  };
}

export interface Slide {
  id: string;
  type: SlideType;
  title?: string;
  elements: SlideElement[];
  background?: {
    color?: string;
    image?: string;
    gradient?: string;
  };
  transition?: {
    type: AnimationType;
    duration: number;
  };
  notes?: string;
}

export interface PitchDeck {
  id: string;
  name: string;
  description?: string;
  brandUrl?: string;
  brandAssets?: BrandAssets;
  slides: Slide[];
  theme: {
    colors: BrandColors;
    fontFamily: string;
  };
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface PresentationSettings {
  autoPlay: boolean;
  autoPlayInterval: number;
  showNotes: boolean;
  loop: boolean;
  enableKeyboardNav: boolean;
}
