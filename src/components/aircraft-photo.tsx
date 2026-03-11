'use client';

import { useEffect, useState } from 'react';

interface PhotoData {
  url: string | null;
  urlLarge: string | null;
  photographer: string | null;
}

interface AircraftPhotoProps {
  icao24: string;
  size: 'thumb' | 'full';
  onPhotoClick?: (url: string, urlLarge: string | null, photographer: string | null) => void;
}

const SIZES = {
  thumb: { width: 72, height: 48 },
  full: { width: 220, height: 130 },
};

const PLANE_SVG = (
  <path
    fill="currentColor"
    d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
  />
);

export function AircraftPhoto({ icao24, size, onPhotoClick }: AircraftPhotoProps) {
  const [photo, setPhoto] = useState<PhotoData | null>(null);
  const { width, height } = SIZES[size];

  useEffect(() => {
    fetch(`/api/aircraft/${icao24}/photo`)
      .then((r) => r.json())
      .then(setPhoto)
      .catch(() => setPhoto({ url: null, urlLarge: null, photographer: null }));
  }, [icao24]);

  if (!photo?.url) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded bg-muted text-muted-foreground"
        style={{ width, height, minWidth: width }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={width * 0.5}
          height={height * 0.5}
        >
          {PLANE_SVG}
        </svg>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col gap-0.5" style={{ width }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt="Aircraft photo"
        className={`rounded object-cover${onPhotoClick ? ' cursor-pointer' : ''}`}
        style={{ width, height }}
        onClick={onPhotoClick ? () => onPhotoClick(photo.url!, photo.urlLarge, photo.photographer) : undefined}
      />
      {photo.photographer && (
        <span className="truncate text-[10px] text-muted-foreground">© {photo.photographer}</span>
      )}
    </div>
  );
}
