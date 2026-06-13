import type { ReactNode } from 'react';
import { getImageUrl } from '../../utils/url';
import { RetryImageButton } from '../RetryImageButton';

interface HeroImageProps {
  imageUrl?: string;
  alt: string;
  entityType: 'character' | 'item' | 'special-item';
  entityId: string;
  fallbackIcon: ReactNode;
  borderClass?: string;
}

export function HeroImage({
  imageUrl,
  alt,
  entityType,
  entityId,
  fallbackIcon,
  borderClass = 'border-ink-700',
}: HeroImageProps) {
  const isCharacter = entityType === 'character';
  const size = isCharacter ? 'w-64 h-64' : 'w-48 h-48';
  const placeholderSize = isCharacter ? 'w-48 h-48' : 'w-36 h-36';
  if (imageUrl) {
    return (
      <div className="flex justify-center mb-5">
        <img
          src={getImageUrl(imageUrl)}
          alt={alt}
          className={`${size} rounded-2xl object-cover border-2 ${borderClass}`}
          style={{ imageRendering: 'auto' }}
        />
      </div>
    );
  }
  return (
    <div className="flex justify-center mb-5">
      <div className={`${placeholderSize} rounded-2xl bg-ink-800/60 border ${borderClass} flex flex-col items-center justify-center gap-2`}>
        {fallbackIcon}
        <RetryImageButton entityType={entityType} entityId={entityId} showLabel />
      </div>
    </div>
  );
}
