/*
 * FeaturesSection — Villa Campito
 * Design: Asymmetric 40/60 layout with feature cards.
 * Left: image, Right: feature grid. Then reversed.
 * Uses REAL photos from the owner.
 */

import { motion } from "framer-motion";
import {
  Waves, Bed, Bath, Wifi, Car, Thermometer,
  UtensilsCrossed, Music, Sun, Dog, Baby, Tv,
  Wind, Droplets, Lamp, TreePalm
} from "lucide-react";
import { EXT_PISCINA_BAR, INT_SALON_1 } from "@/lib/photoUrls";

const FEATURES_EXTERIOR = [
  { icon: Waves, label: "Piscina 3 alturas" },
  { icon: Droplets, label: "Jacuzzi agua fría" },
  { icon: Sun, label: "Cama balinesa" },
  { icon: TreePalm, label: "Chozo bambú africano" },
  { icon: UtensilsCrossed, label: "Barbacoa" },
  { icon: Music, label: "Equipo de música exterior" },
  { icon: Lamp, label: "Luces con domótica" },
  { icon: Waves, label: "Bar en la piscina" },
];

const FEATURES_INTERIOR = [
  { icon: Bed, label: "3 habitaciones" },
  { icon: Bath, label: "1 baño + 2 aseos" },
  { icon: Thermometer, label: "Aire acondicionado y calefacción" },
  { icon: Wind, label: "Ventiladores en todas las habitaciones" },
  { icon: Wifi, label: "Wifi" },
  { icon: Tv, label: "TV 55 pulgadas" },
  { icon: Car, label: "Garaje privado" },
  { icon: UtensilsCrossed, label: "Cocina completa" },
  { icon: Baby, label: "Cuna y trona para bebés" },
  { icon: Dog, label: "Se admiten mascotas" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.05 },
  }),
};

export default function FeaturesSection() {
  return (
    <section id="caracteristicas" className="section-padding bg-white">
      {/* Section header */}
      <div className="container mb-16">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-[2px] bg-[oklch(0.72_0.15_60)]" />
          <span className="text-[oklch(0.72_0.15_60)] text-sm font-medium uppercase tracking-[0.15em]">
            Características
          </span>
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[oklch(0.28_0.07_245)] mb-4">
          Todo lo que necesitas para unas vacaciones perfectas
        </h2>
        <p className="text-[oklch(0.5_0.01_250)] text-lg max-w-2xl leading-relaxed">
          Villa Campito ofrece un espacio único en El Puerto de Santa María, con instalaciones de lujo tanto en el interior como en el exterior.
        </p>
      </div>

      {/* Exterior — Image left, features right */}
      <div className="container mb-20">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <div className="relative overflow-hidden">
              <img
                src={EXT_PISCINA_BAR}
                alt="Piscina de Villa Campito con bar, jacuzzi y cama balinesa"
                className="w-full h-[350px] sm:h-[450px] object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[oklch(0.72_0.15_60)]" />
            </div>
          </motion.div>
          <div className="lg:col-span-2">
            <h3 className="font-heading text-xl font-bold text-[oklch(0.28_0.07_245)] mb-2">
              Zona exterior
            </h3>
            <p className="text-[oklch(0.5_0.01_250)] text-sm mb-6 leading-relaxed">
              Disfruta de una piscina con 3 alturas, bar integrado, jacuzzi, cama balinesa y un auténtico chozo de bambú africano.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES_EXTERIOR.map((f, i) => (
                <motion.div
                  key={f.label}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeInUp}
                  className="flex items-center gap-3 py-3 px-4 bg-[oklch(0.97_0.005_80)] hover:bg-[oklch(0.95_0.01_80)] transition-colors"
                >
                  <f.icon className="w-5 h-5 text-[oklch(0.72_0.15_60)] shrink-0" strokeWidth={1.8} />
                  <span className="text-sm text-[oklch(0.28_0.07_245)] font-medium">{f.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interior — Features left, image right */}
      <div className="container">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <h3 className="font-heading text-xl font-bold text-[oklch(0.28_0.07_245)] mb-2">
              Interior y comodidades
            </h3>
            <p className="text-[oklch(0.5_0.01_250)] text-sm mb-6 leading-relaxed">
              Tres habitaciones, cocina totalmente equipada, aire acondicionado, wifi y todo lo necesario para sentirte como en casa.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES_INTERIOR.map((f, i) => (
                <motion.div
                  key={f.label}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeInUp}
                  className="flex items-center gap-3 py-3 px-4 bg-[oklch(0.97_0.005_80)] hover:bg-[oklch(0.95_0.01_80)] transition-colors"
                >
                  <f.icon className="w-5 h-5 text-[oklch(0.72_0.15_60)] shrink-0" strokeWidth={1.8} />
                  <span className="text-sm text-[oklch(0.28_0.07_245)] font-medium">{f.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 order-1 lg:order-2"
          >
            <div className="relative overflow-hidden">
              <img
                src={INT_SALON_1}
                alt="Interior de Villa Campito con salón y cocina"
                className="w-full h-[350px] sm:h-[450px] object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[oklch(0.72_0.15_60)]" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
