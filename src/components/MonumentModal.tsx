"use client";

import { useEffect, useState } from "react";
import type { Park } from "@/types";

export default function MonumentModal({
  monument,
  onClose
}: {
  monument: Park;
  onClose: () => void;
}) {
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    setGalleryIndex(0);
  }, [monument.parkCode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const images = monument.images ?? [];
  const currentImage = images[galleryIndex];
  const hasMultiple = images.length > 1;
  const goPrev = () => setGalleryIndex((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setGalleryIndex((i) => (i + 1) % images.length);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-start sm:items-center justify-center p-2 sm:p-6 overflow-y-auto"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-forest-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-bark-100 dark:border-forest-700 my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gallery hero */}
        <div className="relative h-56 sm:h-64 bg-forest-900">
          {currentImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={currentImage.url}
              src={currentImage.url}
              alt={currentImage.altText || monument.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-amber-700 to-amber-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {hasMultiple && (
            <div className="absolute top-3 left-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
              {galleryIndex + 1} / {images.length}
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center text-2xl leading-none backdrop-blur-sm"
            aria-label="Close"
          >
            ×
          </button>

          {hasMultiple && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center text-xl backdrop-blur-sm"
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center text-xl backdrop-blur-sm"
                aria-label="Next photo"
              >
                ›
              </button>
            </>
          )}

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <div className="inline-flex items-center gap-1 bg-amber-600/80 text-white text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5 font-semibold">
              🏛 Monument
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl drop-shadow-md">
              {monument.fullName}
            </h2>
            <div className="text-sm opacity-90 mt-1">
              {monument.designation} · {monument.states}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 max-h-[55vh] overflow-y-auto scroll-thin">
          <p className="text-sm text-bark-700 dark:text-forest-200 leading-relaxed whitespace-pre-line">
            {monument.description}
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-bark-100 dark:border-forest-800 px-5 py-3 flex items-center justify-end bg-cream/40 dark:bg-forest-900/40">
          <a
            href={monument.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-full"
          >
            View on nps.gov ↗
          </a>
        </div>
      </div>
    </div>
  );
}
