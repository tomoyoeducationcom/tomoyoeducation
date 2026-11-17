import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 border border-slate-200 ${className}`}
        role="img"
        aria-label={alt}
      >
        <GraduationCap className="w-8 h-8 text-blue-600/40" aria-hidden="true" />
        {fallbackLabel && (
          <span className="mt-2 text-xs font-medium text-slate-500 px-3 text-center">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
