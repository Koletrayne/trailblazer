"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Park, Status, ThingToDo, Campground, Alert } from "@/types";
import StatusPicker from "./StatusPicker";
import StatusBadge from "./StatusBadge";

type Detail = {
  park: Park;
  alerts: Alert[];
  thingsToDo: ThingToDo[];
  campgrounds: Campground[];
};

export default function ParkPreviewModal({
  park,
  status,
  onClose
}: {
  park: Park;
  status: Status;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<Detail>({
    park,
    alerts: [],
    thingsToDo: [],
    campgrounds: []
  });
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setGalleryIndex(0);
    setDetail({ park, alerts: [], thingsToDo: [], campgrounds: [] });
    fetch(`/api/parks/${park.parkCode}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setDetail({
          park: d.park ?? park,
          alerts: d.alerts ?? [],
          thingsToDo: d.thingsToDo ?? [],
          campgrounds: d.campgrounds ?? []
        });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [park]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const p = detail.park;
  const images = p.images ?? [];
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
        className="bg-white dark:bg-forest-900 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-bark-100 dark:border-forest-700 my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gallery hero */}
        <div className="relative h-56 sm:h-72 bg-forest-900">
          {currentImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={currentImage.url}
              src={currentImage.url}
              alt={currentImage.altText || p.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-forest-700 to-forest-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Image counter */}
          {hasMultiple && (
            <div className="absolute top-3 left-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
              {galleryIndex + 1} / {images.length}
            </div>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center text-2xl leading-none backdrop-blur-sm"
            aria-label="Close"
          >
            ×
          </button>

          {/* Gallery arrows */}
          {hasMultiple && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center text-xl backdrop-blur-sm transition-colors"
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-9 h-9 flex items-center justify-center text-xl backdrop-blur-sm transition-colors"
                aria-label="Next photo"
              >
                ›
              </button>
            </>
          )}

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <h2 className="font-display font-bold text-2xl sm:text-3xl drop-shadow-md">
              {p.fullName}
            </h2>
            <div className="text-sm opacity-90 mt-1">
              {p.designation} · {p.states}
            </div>
            <div className="mt-2"><StatusBadge status={status} /></div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 max-h-[60vh] overflow-y-auto scroll-thin">
          {/* Status picker */}
          <Section title="My status">
            <StatusPicker parkCode={p.parkCode} />
          </Section>

          {/* Description */}
          <Section title="About">
            <p className="text-sm text-bark-700 dark:text-forest-200 leading-relaxed">
              {p.description}
            </p>
          </Section>

          {/* Alerts */}
          {detail.alerts.length > 0 && (
            <Section title={`⚠ Active alerts (${detail.alerts.length})`}>
              <ul className="space-y-2">
                {detail.alerts.slice(0, 3).map((a) => (
                  <li
                    key={a.id}
                    className="border-l-2 border-amber-500 bg-amber-50 dark:bg-amber-900/20 pl-3 py-1.5 pr-2 rounded-r"
                  >
                    <div className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold">
                      {a.category}
                    </div>
                    <div className="text-sm font-semibold text-bark-800 dark:text-forest-100">
                      {a.title}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Hikes & activities */}
          <Section title="Hikes & things to do">
            {loading ? (
              <SkeletonRow />
            ) : detail.thingsToDo.length === 0 ? (
              <Empty>No specific activities returned by NPS for this park yet.</Empty>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {detail.thingsToDo.slice(0, 4).map((t) => (
                  <a
                    key={t.id}
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 rounded-lg bg-cream/60 dark:bg-forest-800/40 hover:bg-forest-50 dark:hover:bg-forest-800 p-2 transition-colors"
                  >
                    {t.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.imageUrl}
                        alt={t.title}
                        className="w-20 h-20 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-bark-800 dark:text-forest-100 line-clamp-2">
                        {t.title}
                      </div>
                      {(t.duration || t.difficulty) && (
                        <div className="text-[11px] text-bark-500 dark:text-forest-300 mt-0.5">
                          {t.duration && <span>⏱ {t.duration}</span>}
                          {t.duration && t.difficulty && <span> · </span>}
                          {t.difficulty && <span>📈 {t.difficulty}</span>}
                        </div>
                      )}
                      {t.shortDescription && (
                        <p className="text-xs text-bark-600 dark:text-forest-300 mt-1 line-clamp-2">
                          {t.shortDescription}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </Section>

          {/* Campgrounds */}
          <Section title="Campgrounds">
            {loading ? (
              <SkeletonRow />
            ) : detail.campgrounds.length === 0 ? (
              <Empty>
                No campgrounds returned by NPS for this park. Some parks rely on backcountry permits or external lodging.
              </Empty>
            ) : (
              <ul className="space-y-2">
                {detail.campgrounds.slice(0, 4).map((c) => (
                  <li
                    key={c.id}
                    className="flex gap-3 rounded-lg bg-cream/60 dark:bg-forest-800/40 p-2"
                  >
                    {c.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="w-20 h-20 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-sm text-bark-800 dark:text-forest-100">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-bark-500 dark:text-forest-300 text-right shrink-0">
                          {c.numberOfSitesReservable && (
                            <div>{c.numberOfSitesReservable} reservable</div>
                          )}
                          {c.numberOfSitesFirstComeFirstServe && (
                            <div>{c.numberOfSitesFirstComeFirstServe} first-come</div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-bark-600 dark:text-forest-300 line-clamp-2 mt-0.5">
                        {c.description}
                      </p>
                      {(c.reservationUrl || c.url) && (
                        <div className="flex gap-3 mt-1.5 text-xs">
                          {c.reservationUrl && (
                            <a
                              href={c.reservationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-forest-600 dark:text-forest-300 hover:underline font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Reserve ↗
                            </a>
                          )}
                          {c.url && (
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-bark-500 dark:text-forest-300 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Details ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* Footer actions */}
        <div className="border-t border-bark-100 dark:border-forest-800 px-5 py-3 flex items-center justify-between bg-cream/40 dark:bg-forest-900/40">
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-forest-600 dark:text-forest-300 hover:underline font-medium"
          >
            nps.gov ↗
          </a>
          <Link
            href={`/parks/${p.parkCode}`}
            className="bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold px-4 py-2 rounded-full"
          >
            Full park details →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs uppercase tracking-wide text-bark-500 dark:text-forest-300 font-semibold mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {[0, 1].map((i) => (
        <div key={i} className="h-20 rounded-lg bg-cream/60 dark:bg-forest-800/40 animate-pulse" />
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-bark-500 dark:text-forest-300 italic">{children}</div>
  );
}
