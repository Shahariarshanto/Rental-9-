import React, { useState } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface OptimizedImageProps extends HTMLMotionProps<"img"> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

/**
 * OptimizedImage component that:
 * 1. Handles lazy loading by default
 * 2. Uses async decoding
 * 3. Attempts to convert Unsplash URLs to WebP automatically
 * 4. Shows a smooth fade-in and loading state
 */
export default function OptimizedImage({ 
  src, 
  alt, 
  className = "", 
  fallbackSrc = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop",
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Optimize Unsplash URLs if detected
  const getOptimizedUrl = (url: string) => {
    if (url.includes('images.unsplash.com')) {
      const baseUrl = url.split('?')[0];
      // Force auto=format (which usually serves WebP if supported), 
      // and add reasonable quality/width constraints
      return `${baseUrl}?q=75&fm=webp&auto=format&fit=crop&w=800`;
    }
    return url;
  };

  const finalSrc = error ? fallbackSrc : getOptimizedUrl(src);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading Shimmer/Spinner */}
      <AnimatePresence>
        {!isLoaded && !error && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          >
            <div className="w-full h-full bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse" />
            <Loader2 className="absolute w-5 h-5 text-gray-300 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover ${className}`}
        {...props}
      />
    </div>
  );
}
