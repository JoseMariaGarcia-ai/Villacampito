/*
 * VideoSection — Villa Campito
 * Video gallery with two videos: exterior and interior.
 * Videos autoplay muted on load (required for mobile autoplay).
 * Users can unmute and control playback.
 */

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { VolumeX, Volume2, Film } from "lucide-react";
import { VIDEO_EXTERIOR, VIDEO_INTERIOR } from "@/lib/photoUrls";

const VIDEOS = [
  {
    src: VIDEO_INTERIOR,
    title: "Recorrido Exterior",
    description:
      "Descubre la piscina con 3 alturas, el bar, el jacuzzi, la cama balinesa, el chozo de bambú africano, la barbacoa y todo el jardín de Villa Campito.",
  },
  {
    src: VIDEO_EXTERIOR,
    title: "Recorrido Interior",
    description:
      "Explora las 3 habitaciones, el salón-comedor, la cocina equipada, los baños y todas las comodidades del interior de la villa.",
  },
];

function AutoplayVideo({ video, idx }: { video: typeof VIDEOS[0]; idx: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Intersection Observer to play/pause based on visibility
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {
            // Autoplay blocked — silently ignore
          });
        } else {
          el.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  return (
    <motion.div
      key={idx}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: idx * 0.15 }}
      className="group"
    >
      {/* Video container */}
      <div className="relative aspect-video bg-black overflow-hidden">
        <video
          ref={videoRef}
          src={video.src}
          controls
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        />

        {/* Mute/unmute button */}
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
          aria-label={muted ? "Activar sonido" : "Silenciar"}
        >
          {muted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Film className="w-4 h-4 text-[oklch(0.72_0.15_60)]" />
          <h3 className="font-heading text-lg font-semibold text-[oklch(0.28_0.07_245)]">
            {video.title}
          </h3>
        </div>
        <p className="text-[oklch(0.5_0.01_250)] text-sm leading-relaxed">
          {video.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function VideoSection() {
  return (
    <section id="videos" className="section-padding bg-[oklch(0.97_0.005_80)]">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-[2px] bg-[oklch(0.72_0.15_60)]" />
            <span className="text-[oklch(0.72_0.15_60)] text-sm font-medium uppercase tracking-[0.15em]">
              Vídeos
            </span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[oklch(0.28_0.07_245)] mb-4">
            Recorre Villa Campito
          </h2>
          <p className="text-[oklch(0.5_0.01_250)] text-lg max-w-2xl leading-relaxed">
            Dos recorridos en vídeo para que descubras cada rincón de la villa antes de tu visita.
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {VIDEOS.map((video, idx) => (
            <AutoplayVideo key={idx} video={video} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
