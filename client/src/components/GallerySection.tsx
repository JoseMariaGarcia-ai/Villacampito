/*
 * GallerySection — Villa Campito
 * Photo gallery with lightbox using ALL REAL photos from the owner.
 * Tabs: Todas | Exterior | Piscina | Interior
 * Clean grid, zoom on hover, click to expand.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { ALL_EXTERIOR, ALL_INTERIOR } from "@/lib/photoUrls";

type GalleryItem = { src: string; alt: string; category: string };

const ALL_ITEMS: GalleryItem[] = [...ALL_EXTERIOR, ...ALL_INTERIOR];

const TABS = ["Todas", "Exterior", "Interior"] as const;

export default function GallerySection() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Todas");

  const filtered = useMemo(() => {
    if (activeTab === "Todas") return ALL_ITEMS;
    return ALL_ITEMS.filter((item) => item.category === activeTab);
  }, [activeTab]);

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const prevImage = () =>
    setLightboxIdx((prev) =>
      prev !== null ? (prev - 1 + filtered.length) % filtered.length : null
    );
  const nextImage = () =>
    setLightboxIdx((prev) =>
      prev !== null ? (prev + 1) % filtered.length : null
    );

  return (
    <section id="galeria" className="section-padding bg-white">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-[2px] bg-[oklch(0.72_0.15_60)]" />
            <span className="text-[oklch(0.72_0.15_60)] text-sm font-medium uppercase tracking-[0.15em]">
              Galería
            </span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[oklch(0.28_0.07_245)] mb-4">
            Fotos de Villa Campito
          </h2>
          <p className="text-[oklch(0.5_0.01_250)] text-lg max-w-2xl leading-relaxed">
            Descubre cada rincón de nuestra villa a través de estas imágenes reales.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-sm font-heading font-medium uppercase tracking-wide transition-colors duration-200 ${
                activeTab === tab
                  ? "bg-[oklch(0.28_0.07_245)] text-white"
                  : "bg-[oklch(0.97_0.005_80)] text-[oklch(0.5_0.01_250)] hover:bg-[oklch(0.93_0.01_80)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {filtered.map((item, idx) => (
            <motion.button
              key={`${activeTab}-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
              onClick={() => openLightbox(idx)}
              className={`relative overflow-hidden group ${
                idx === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              <img
                src={item.src}
                alt={item.alt}
                className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  idx === 0 ? "h-[300px] sm:h-[400px] md:h-[500px]" : "h-[160px] sm:h-[200px] md:h-[250px]"
                }`}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-end">
                <div className="p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-2 text-white text-xs sm:text-sm">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{item.category}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
              aria-label="Cerrar"
            >
              <X className="w-8 h-8" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 p-2"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 p-2"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
            <motion.img
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              src={filtered[lightboxIdx].src}
              alt={filtered[lightboxIdx].alt}
              className="max-w-[90vw] max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {lightboxIdx + 1} / {filtered.length} — {filtered[lightboxIdx].alt}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
