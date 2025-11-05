'use client';

import { motion } from 'framer-motion';
import { Slide, SlideElement, AnimationType } from '@/types/deck';

interface SlideRendererProps {
  slide: Slide;
}

const elementAnimationVariants: Record<AnimationType, any> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slide: {
    hidden: { x: -50, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  },
  zoom: {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
  },
  flip: {
    hidden: { rotateX: 90, opacity: 0 },
    visible: { rotateX: 0, opacity: 1 },
  },
  rotate: {
    hidden: { rotate: -180, opacity: 0 },
    visible: { rotate: 0, opacity: 1 },
  },
  bounce: {
    hidden: { y: -50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', bounce: 0.6 }
    },
  },
  none: {
    hidden: {},
    visible: {},
  },
};

export default function SlideRenderer({ slide }: SlideRendererProps) {
  const renderElement = (element: SlideElement) => {
    const animationType = element.animation?.type || 'fade';
    const animationDuration = element.animation?.duration || 0.5;
    const animationDelay = element.animation?.delay || 0;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${element.position.x}%`,
      top: `${element.position.y}%`,
      width: `${element.size.width}%`,
      height: `${element.size.height}%`,
      ...element.style,
    };

    return (
      <motion.div
        key={element.id}
        style={baseStyle}
        variants={elementAnimationVariants[animationType]}
        initial="hidden"
        animate="visible"
        transition={{
          duration: animationDuration,
          delay: animationDelay,
        }}
      >
        {renderElementContent(element)}
      </motion.div>
    );
  };

  const renderElementContent = (element: SlideElement) => {
    switch (element.type) {
      case 'text':
        return (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              fontSize: element.style?.fontSize || 16,
              fontWeight: element.style?.fontWeight || 'normal',
              color: element.style?.color || '#000000',
              backgroundColor: element.style?.backgroundColor,
              borderRadius: element.style?.borderRadius,
              padding: element.style?.padding,
            }}
          >
            {element.content}
          </div>
        );

      case 'image':
        return (
          <img
            src={element.content}
            alt=""
            className="w-full h-full object-cover"
            style={{
              borderRadius: element.style?.borderRadius,
            }}
          />
        );

      case 'icon':
        return (
          <div
            className="w-full h-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: element.content }}
          />
        );

      case 'shape':
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: element.style?.backgroundColor || '#000000',
              borderRadius: element.style?.borderRadius || 0,
            }}
          />
        );

      default:
        return null;
    }
  };

  const backgroundStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: slide.background?.color || '#ffffff',
    backgroundImage: slide.background?.image
      ? `url(${slide.background.image})`
      : slide.background?.gradient,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div style={backgroundStyle} className="relative">
      {/* Slide Title */}
      {slide.title && (
        <motion.div
          className="absolute top-12 left-12 text-4xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {slide.title}
        </motion.div>
      )}

      {/* Slide Elements */}
      {slide.elements.map(renderElement)}
    </div>
  );
}
