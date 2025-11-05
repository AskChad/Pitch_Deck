'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slide, PresentationSettings, AnimationType } from '@/types/deck';
import SlideRenderer from './SlideRenderer';

interface PresentationModeProps {
  slides: Slide[];
  settings?: Partial<PresentationSettings>;
  onExit?: () => void;
}

const animationVariants: Record<AnimationType, any> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { x: 1000, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -1000, opacity: 0 },
  },
  zoom: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 2, opacity: 0 },
  },
  flip: {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: -90, opacity: 0 },
  },
  rotate: {
    initial: { rotate: 180, opacity: 0 },
    animate: { rotate: 0, opacity: 1 },
    exit: { rotate: -180, opacity: 0 },
  },
  bounce: {
    initial: { y: -1000, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', bounce: 0.4 }
    },
    exit: { y: 1000, opacity: 0 },
  },
  none: {
    initial: {},
    animate: {},
    exit: {},
  },
};

export default function PresentationMode({
  slides,
  settings,
  onExit,
}: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const defaultSettings: PresentationSettings = {
    autoPlay: false,
    autoPlayInterval: 5000,
    showNotes: false,
    loop: false,
    enableKeyboardNav: true,
    ...settings,
  };

  // Keyboard navigation
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!defaultSettings.enableKeyboardNav) return;

      switch (event.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          nextSlide();
          break;
        case 'ArrowLeft':
          prevSlide();
          break;
        case 'Home':
          setCurrentSlide(0);
          break;
        case 'End':
          setCurrentSlide(slides.length - 1);
          break;
        case 'Escape':
          exitPresentation();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    },
    [currentSlide, slides.length, defaultSettings.enableKeyboardNav]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Auto-play
  useEffect(() => {
    if (!defaultSettings.autoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        if (prev >= slides.length - 1) {
          return defaultSettings.loop ? 0 : prev;
        }
        return prev + 1;
      });
    }, defaultSettings.autoPlayInterval);

    return () => clearInterval(interval);
  }, [defaultSettings.autoPlay, defaultSettings.autoPlayInterval, defaultSettings.loop, slides.length]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout((window as any).controlsTimeout);
      (window as any).controlsTimeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout((window as any).controlsTimeout);
    };
  }, []);

  const nextSlide = () => {
    setCurrentSlide(prev => {
      if (prev >= slides.length - 1) {
        return defaultSettings.loop ? 0 : prev;
      }
      return prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : prev));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
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

  const exitPresentation = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onExit?.();
  };

  const currentSlideData = slides[currentSlide];
  const transitionType = currentSlideData?.transition?.type || 'fade';
  const transitionDuration = currentSlideData?.transition?.duration || 0.5;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Slide Container */}
      <div className="w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="w-full h-full"
            variants={animationVariants[transitionType]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: transitionDuration }}
          >
            <SlideRenderer slide={currentSlideData} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 p-6"
        initial={{ opacity: 1 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-700 rounded-full mb-4">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{
                width: `${((currentSlide + 1) / slides.length) * 100}%`,
              }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={nextSlide}
                disabled={currentSlide === slides.length - 1 && !defaultSettings.loop}
                className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>

            <div className="text-sm">
              {currentSlide + 1} / {slides.length}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleFullscreen}
                className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
              >
                {isFullscreen ? '⊡' : '⛶'} Fullscreen
              </button>
              <button
                onClick={exitPresentation}
                className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Slide Notes */}
          {defaultSettings.showNotes && currentSlideData?.notes && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg text-white">
              <p className="text-sm">{currentSlideData.notes}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Slide Navigation Thumbnails */}
      <motion.div
        className="absolute top-6 right-6"
        initial={{ opacity: 1 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className={`w-16 h-12 rounded border-2 transition-all ${
                index === currentSlide
                  ? 'border-blue-500 scale-110'
                  : 'border-gray-600 opacity-50 hover:opacity-100'
              }`}
              style={{
                background: slide.background?.color || '#1f2937',
              }}
            >
              <span className="text-white text-xs">{index + 1}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Keyboard Shortcuts Help */}
      <motion.div
        className="absolute top-6 left-6 text-white text-xs"
        initial={{ opacity: 1 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-gray-800 p-3 rounded-lg">
          <p className="font-bold mb-2">Keyboard Shortcuts:</p>
          <ul className="space-y-1">
            <li>→ / Space: Next slide</li>
            <li>← : Previous slide</li>
            <li>F: Fullscreen</li>
            <li>Esc: Exit</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
