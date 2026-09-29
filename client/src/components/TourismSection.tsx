/*
 * TourismSection — Villa Campito
 * Design: "Sal y Sol" Coastal Minimalism, tabbed content on sand background.
 * Practical guide to El Puerto de Santa María for guests: sights, beaches,
 * recommended places to eat, and emergency/medical phone numbers.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark, Waves, UtensilsCrossed, Phone, MapPin, Siren, Building2,
} from "lucide-react";

type TabKey = "sitios" | "playas" | "comer" | "emergencias";

const TABS: { key: TabKey; label: string; icon: typeof Landmark }[] = [
  { key: "sitios", label: "Qué ver", icon: Landmark },
  { key: "playas", label: "Playas", icon: Waves },
  { key: "comer", label: "Dónde comer", icon: UtensilsCrossed },
  { key: "emergencias", label: "Emergencias y médicos", icon: Siren },
];

const SITIOS = [
  {
    name: "Castillo de San Marcos",
    text: "Fortaleza del siglo XIII construida sobre una antigua mezquita almohade. Visitas guiadas con cata de vinos incluida.",
  },
  {
    name: "Ribera del Marisco",
    text: "Paseo junto al río Guadalete lleno de bares de pescaíto frito y marisco al aire libre. Uno de los sellos de identidad de la ciudad.",
  },
  {
    name: "Plaza de Toros",
    text: "Una de las plazas más grandes y antiguas de España, con capacidad para más de 12.000 espectadores.",
  },
  {
    name: "Bodegas Fundador",
    text: "La bodega de brandy más antigua de España, con visitas guiadas y cata en pleno centro histórico.",
  },
  {
    name: "Parque Calderón",
    text: "Jardín histórico junto al río, con quiosco de música y vistas a la Bahía de Cádiz. Ideal para pasear al atardecer.",
  },
  {
    name: "Iglesia Mayor Prioral",
    text: "Templo principal de la ciudad, de fachada barroca, situado en el corazón del casco histórico.",
  },
];

const PLAYAS = [
  {
    name: "Playa de Valdelagrana",
    text: "Amplia playa urbana de arena fina, con paseo marítimo, chiringuitos y todos los servicios. La más popular de la zona.",
  },
  {
    name: "Playa de La Puntilla",
    text: "Situada en la desembocadura del Guadalete, junto al puerto pesquero. Tranquila y con buen ambiente familiar.",
  },
  {
    name: "Playa de Santa Catalina - Fuentebravía",
    text: "Playa más salvaje y menos masificada, popular entre surfistas por su oleaje. Buena opción para escapar del bullicio.",
  },
];

const COMER = [
  {
    name: "Romerijo",
    text: "Icono de El Puerto desde 1954. Marisco y pescaíto frito para llevar y comer en la calle, al estilo tradicional gaditano.",
  },
  {
    name: "El Faro del Puerto",
    text: "Referente de la alta cocina gaditana con más de 40 años de historia. Ideal para una cena especial.",
  },
  {
    name: "Casa Flores",
    text: "Restaurante clásico de la Ribera del Marisco, especializado en pescados y mariscos de la bahía.",
  },
  {
    name: "Los Portales",
    text: "Cocina tradicional gaditana en un local con solera, muy recomendado por los locales.",
  },
];

const EMERGENCIAS = [
  { name: "Emergencias generales", phone: "112", text: "Número único de emergencias en toda España: sanitarias, incendios, seguridad." },
  { name: "Emergencias sanitarias", phone: "061", text: "Urgencias médicas y ambulancias." },
  { name: "Policía Nacional", phone: "091", text: "Delitos, robos y seguridad ciudadana." },
  { name: "Policía Local", phone: "092", text: "Número nacional de referencia para la policía local del municipio." },
  { name: "Guardia Civil", phone: "062", text: "Seguridad en carreteras y zonas periurbanas." },
  { name: "Bomberos", phone: "080", text: "Incendios y rescates." },
];

export default function TourismSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("sitios");

  return (
    <section id="turismo" className="section-padding bg-[oklch(0.97_0.005_80)]">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-[2px] bg-[oklch(0.72_0.15_60)]" />
            <span className="text-[oklch(0.72_0.15_60)] text-sm font-medium uppercase tracking-[0.15em]">
              El Puerto de Santa María
            </span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[oklch(0.28_0.07_245)] mb-4">
            Información Turística
          </h2>
          <p className="text-[oklch(0.5_0.01_250)] text-lg max-w-2xl leading-relaxed">
            Todo lo que necesitas para disfrutar de tu estancia: qué visitar, dónde bañarte, dónde comer y los teléfonos importantes a mano.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium uppercase tracking-wide transition-colors duration-200 ${
                activeTab === tab.key
                  ? "bg-[oklch(0.28_0.07_245)] text-white"
                  : "bg-white text-[oklch(0.28_0.07_245)] border border-[oklch(0.9_0.005_250)] hover:border-[oklch(0.72_0.15_60)]/40"
              }`}
            >
              <tab.icon className="w-4 h-4" strokeWidth={1.8} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "sitios" && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SITIOS.map((item) => (
                  <div key={item.name} className="bg-white border border-[oklch(0.9_0.005_250)] p-6 flex gap-4">
                    <MapPin className="w-5 h-5 text-[oklch(0.72_0.15_60)] shrink-0 mt-0.5" strokeWidth={1.8} />
                    <div>
                      <h3 className="font-heading text-base font-bold text-[oklch(0.28_0.07_245)] mb-1">{item.name}</h3>
                      <p className="text-sm text-[oklch(0.5_0.01_250)] leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "playas" && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PLAYAS.map((item) => (
                  <div key={item.name} className="bg-white border border-[oklch(0.9_0.005_250)] p-6 flex gap-4">
                    <Waves className="w-5 h-5 text-[oklch(0.72_0.15_60)] shrink-0 mt-0.5" strokeWidth={1.8} />
                    <div>
                      <h3 className="font-heading text-base font-bold text-[oklch(0.28_0.07_245)] mb-1">{item.name}</h3>
                      <p className="text-sm text-[oklch(0.5_0.01_250)] leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "comer" && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {COMER.map((item) => (
                  <div key={item.name} className="bg-white border border-[oklch(0.9_0.005_250)] p-6 flex gap-4">
                    <UtensilsCrossed className="w-5 h-5 text-[oklch(0.72_0.15_60)] shrink-0 mt-0.5" strokeWidth={1.8} />
                    <div>
                      <h3 className="font-heading text-base font-bold text-[oklch(0.28_0.07_245)] mb-1">{item.name}</h3>
                      <p className="text-sm text-[oklch(0.5_0.01_250)] leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "emergencias" && (
              <div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {EMERGENCIAS.map((item) => (
                    <a
                      key={item.name}
                      href={`tel:${item.phone}`}
                      className="bg-white border border-[oklch(0.9_0.005_250)] p-6 flex gap-4 hover:border-[oklch(0.72_0.15_60)]/40 transition-colors"
                    >
                      <Phone className="w-5 h-5 text-[oklch(0.72_0.15_60)] shrink-0 mt-0.5" strokeWidth={1.8} />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading text-base font-bold text-[oklch(0.28_0.07_245)]">{item.name}</h3>
                          <span className="text-[oklch(0.72_0.15_60)] font-bold text-sm">{item.phone}</span>
                        </div>
                        <p className="text-sm text-[oklch(0.5_0.01_250)] leading-relaxed">{item.text}</p>
                      </div>
                    </a>
                  ))}
                </div>

                <div className="mt-6 flex items-start gap-4 bg-[oklch(0.28_0.07_245)]/5 border border-[oklch(0.28_0.07_245)]/15 p-6">
                  <Building2 className="w-5 h-5 text-[oklch(0.28_0.07_245)] shrink-0 mt-0.5" />
                  <p className="text-sm text-[oklch(0.28_0.07_245)] leading-relaxed">
                    Para una urgencia médica durante tu estancia, el hospital de referencia de la zona es el <strong>Hospital de Jerez de la Frontera</strong> (Servicio Andaluz de Salud). Ante cualquier emergencia, llama primero al <strong>112</strong>: ellos te derivarán al servicio adecuado.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
