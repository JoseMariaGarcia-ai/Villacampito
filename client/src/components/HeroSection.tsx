/*
 * HeroSection — Villa Campito
 * Full-bleed hero with auto-rotating carousel of exterior photos.
 * Smooth crossfade transition between images every 5 seconds.
 * Dark image background → white text.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  EXT_PANORAMICA,
  EXT_VISTA_GENERAL,
  EXT_PISCINA_BAR,
  EXT_CAMA_BALINESA,
  EXT_PISCINA_NOCHE,
  EXT_CHOZO_BAMBU,
  EXT_BARBACOA,
  EXT_FACHADA,
  EXT_JARDIN,
  EXT_TUMBONAS,
  EXT_ZONA_RELAX,
} from "@/lib/photoUrls";

const HERO_IMAGES = [
  EXT_PANORAMICA,
  EXT_VISTA_GENERAL,
  EXT_PISCINA_BAR,
  EXT_CAMA_BALINESA,
  EXT_PISCINA_NOCHE,
  EXT_CHOZO_BAMBU,
  EXT_BARBACOA,
  EXT_FACHADA,
  EXT_JARDIN,
  EXT_TUMBONAS,
  EXT_ZONA_RELAX,
];

const INTERVAL_MS = 5000;

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % HERO_IMAGES.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [next, paused]);

  const scrollToContent = () => {
    const el = document.querySelector("#caracteristicas");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="inicio"
      className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background Images with crossfade */}
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_IMAGES[current]})` }}
        />
      </AnimatePresence>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-all backdrop-blur-sm rounded-full"
        aria-label="Foto anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-all backdrop-blur-sm rounded-full"
        aria-label="Foto siguiente"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide indicators */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 transition-all duration-300 ${
              i === current
                ? "w-8 bg-[oklch(0.72_0.15_60)]"
                : "w-3 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Ir a foto ${i + 1}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative h-full container flex flex-col justify-center items-center z-10 text-center px-16 sm:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-2xl"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="w-12 h-[2px] bg-[oklch(0.72_0.15_60)]" />
            <span className="text-white/80 text-sm font-medium uppercase tracking-[0.2em]">
              El Puerto de Santa María, Cádiz
            </span>
            <span className="w-12 h-[2px] bg-[oklch(0.72_0.15_60)]" />
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6">
            Villa Campito
          </h1>
          <p className="text-white/85 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg mx-auto">
            Un refugio exclusivo con piscina, jacuzzi, barbacoa y todas las comodidades para unas vacaciones inolvidables en la costa gaditana.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://wa.me/34640723374?text=Hola%2C%20me%20gustar%C3%ADa%20obtener%20informaci%C3%B3n%20sobre%20Villa%20Campito%20y%20disponibilidad.%20%C2%A1Gracias!"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white font-heading font-semibold text-sm uppercase tracking-wide hover:bg-[#20BD5A] transition-colors duration-300 shadow-[0_4px_16px_rgba(37,211,102,0.3)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-5 h-5"><path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.914 15.914 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.31 22.606c-.39 1.1-1.932 2.014-3.168 2.282-.846.18-1.95.324-5.668-1.218-4.762-1.972-7.824-6.81-8.062-7.126-.228-.316-1.916-2.55-1.916-4.864 0-2.314 1.214-3.452 1.644-3.924.39-.428 1.028-.624 1.638-.624.198 0 .376.01.536.018.47.02.706.048 1.016.788.39.928 1.338 3.264 1.454 3.502.118.238.236.558.076.876-.15.326-.282.528-.52.808-.238.28-.5.624-.714.838-.238.238-.486.496-.208.968.278.47 1.236 2.038 2.654 3.302 1.822 1.624 3.358 2.126 3.836 2.362.478.238.756.198 1.034-.118.278-.316 1.196-1.392 1.514-1.87.316-.478.634-.396 1.072-.238.438.158 2.772 1.308 3.248 1.546.478.238.796.356.914.554.118.198.118 1.148-.272 2.248z"/></svg>
              Reservar por WhatsApp
            </a>

          </div>
        </motion.div>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="absolute bottom-24 left-0 right-0 container"
        >
          <div className="flex flex-wrap gap-8 sm:gap-12 text-white/80 text-sm justify-center">
            <div>
              <span className="block font-heading text-2xl font-bold text-white">8</span>
              Personas
            </div>
            <div>
              <span className="block font-heading text-2xl font-bold text-white">3</span>
              Habitaciones
            </div>
            <div>
              <span className="block font-heading text-2xl font-bold text-white">3</span>
              Niveles de piscina
            </div>
            <div>
              <span className="block font-heading text-2xl font-bold text-white">1</span>
              Jacuzzi exterior
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.button
        onClick={scrollToContent}
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors z-20"
        aria-label="Desplazar hacia abajo"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.button>
    </section>
  );
}
