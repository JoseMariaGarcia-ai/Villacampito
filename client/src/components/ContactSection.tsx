/*
 * ContactSection — Villa Campito
 * Contact form that sends directly to WhatsApp (640723374).
 * Design: White bg, clean form with sharp edges, WhatsApp-centric.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, MessageCircle, CheckCircle } from "lucide-react";

const WHATSAPP_NUMBER = "34640723374";

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    personas: "",
    llegada: "",
    salida: "",
    comentarios: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build WhatsApp message
    const lines = [
      `🏡 *Consulta de reserva — Villa Campito*`,
      ``,
      `👤 *Nombre:* ${formData.nombre}`,
      `👥 *Personas:* ${formData.personas || "No indicado"}`,
      `📅 *Llegada:* ${formData.llegada || "No indicada"}`,
      `📅 *Salida:* ${formData.salida || "No indicada"}`,
    ];

    if (formData.comentarios.trim()) {
      lines.push(``, `💬 *Comentarios:*`, formData.comentarios);
    }

    const message = encodeURIComponent(lines.join("\n"));
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    window.open(url, "_blank");
    setSubmitted(true);
  };

  return (
    <section id="contacto" className="section-padding bg-white">
      <div className="container">
        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-[2px] bg-[oklch(0.72_0.15_60)]" />
            <span className="text-[oklch(0.72_0.15_60)] text-sm font-medium uppercase tracking-[0.15em]">
              Contacto
            </span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[oklch(0.28_0.07_245)] mb-4">
            Reserva tu estancia
          </h2>
          <p className="text-[oklch(0.5_0.01_250)] text-lg max-w-2xl leading-relaxed">
            Completa el formulario y te contactaremos directamente por WhatsApp. Respuesta rápida garantizada.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            {submitted ? (
              <div className="bg-[oklch(0.97_0.005_80)] border border-[oklch(0.9_0.005_250)] p-12 text-center">
                <CheckCircle className="w-12 h-12 text-[#25D366] mx-auto mb-4" />
                <h3 className="font-heading text-xl font-bold text-[oklch(0.28_0.07_245)] mb-2">
                  Mensaje enviado por WhatsApp
                </h3>
                <p className="text-[oklch(0.5_0.01_250)] mb-6">
                  Tu consulta se ha abierto en WhatsApp. Si no se abrió automáticamente, haz clic en el botón de abajo.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white font-heading font-semibold text-sm uppercase tracking-wide hover:bg-[#20BD5A] transition-colors"
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                    Abrir WhatsApp
                  </a>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-3 bg-[oklch(0.28_0.07_245)] text-white font-heading font-semibold text-sm uppercase tracking-wide hover:bg-[oklch(0.22_0.06_245)] transition-colors"
                  >
                    Enviar otra consulta
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* WhatsApp badge */}
                <div className="flex items-center gap-3 bg-[#25D366]/10 border border-[#25D366]/20 px-4 py-3 mb-2">
                  <WhatsAppIcon className="w-6 h-6 text-[#25D366] shrink-0" />
                  <p className="text-sm text-[oklch(0.35_0.05_245)]">
                    Al enviar, se abrirá WhatsApp con tu mensaje listo para enviar al <strong>640 723 374</strong>
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[oklch(0.5_0.01_250)] uppercase tracking-wide mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      required
                      value={formData.nombre}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[oklch(0.97_0.005_80)] border border-[oklch(0.9_0.005_250)] text-[oklch(0.28_0.07_245)] text-sm focus:border-[#25D366] focus:outline-none transition-colors"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[oklch(0.5_0.01_250)] uppercase tracking-wide mb-2">
                      Número de personas
                    </label>
                    <select
                      name="personas"
                      value={formData.personas}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[oklch(0.97_0.005_80)] border border-[oklch(0.9_0.005_250)] text-[oklch(0.28_0.07_245)] text-sm focus:border-[#25D366] focus:outline-none transition-colors"
                    >
                      <option value="">Seleccionar</option>
                      <option value="1-2">1 — 2 personas</option>
                      <option value="3-4">3 — 4 personas</option>
                      <option value="5-6">5 — 6 personas</option>
                      <option value="7-8">7 — 8 personas</option>
                      <option value="9+">9 o más personas</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[oklch(0.5_0.01_250)] uppercase tracking-wide mb-2">
                      Fecha de llegada
                    </label>
                    <input
                      type="date"
                      name="llegada"
                      value={formData.llegada}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[oklch(0.97_0.005_80)] border border-[oklch(0.9_0.005_250)] text-[oklch(0.28_0.07_245)] text-sm focus:border-[#25D366] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[oklch(0.5_0.01_250)] uppercase tracking-wide mb-2">
                      Fecha de salida
                    </label>
                    <input
                      type="date"
                      name="salida"
                      value={formData.salida}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[oklch(0.97_0.005_80)] border border-[oklch(0.9_0.005_250)] text-[oklch(0.28_0.07_245)] text-sm focus:border-[#25D366] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[oklch(0.5_0.01_250)] uppercase tracking-wide mb-2">
                    Comentarios
                  </label>
                  <textarea
                    name="comentarios"
                    rows={4}
                    value={formData.comentarios}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[oklch(0.97_0.005_80)] border border-[oklch(0.9_0.005_250)] text-[oklch(0.28_0.07_245)] text-sm focus:border-[#25D366] focus:outline-none transition-colors resize-none"
                    placeholder="Necesidades especiales, preguntas, peticiones..."
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-[#25D366] text-white font-heading font-semibold text-sm uppercase tracking-wide hover:bg-[#20BD5A] transition-colors shadow-[0_4px_16px_rgba(37,211,102,0.3)]"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  Enviar por WhatsApp
                </button>
              </form>
            )}
          </motion.div>

          {/* Contact info sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            {/* Direct WhatsApp card */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#25D366] p-8 text-white mb-6 hover:bg-[#20BD5A] transition-colors group"
            >
              <div className="flex items-center gap-3 mb-4">
                <WhatsAppIcon className="w-8 h-8" />
                <h3 className="font-heading text-lg font-bold">WhatsApp directo</h3>
              </div>
              <p className="text-white/90 text-2xl font-heading font-bold mb-2">
                640 723 374
              </p>
              <p className="text-white/70 text-sm">
                Pulsa aquí para escribirnos directamente por WhatsApp. Respuesta rápida.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4" />
                Iniciar conversación →
              </div>
            </a>

            {/* Info card */}
            <div className="bg-[oklch(0.28_0.07_245)] p-8 text-white mb-6">
              <h3 className="font-heading text-lg font-bold mb-6">Información</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-[oklch(0.72_0.15_60)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Ubicación</p>
                    <p className="text-sm text-white/70">El Puerto de Santa María, Cádiz</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-[oklch(0.72_0.15_60)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Horarios</p>
                    <p className="text-sm text-white/70">Check-in: 14:00 h</p>
                    <p className="text-sm text-white/70">Check-out: 10:00 h</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <UsersIcon className="w-5 h-5 text-[oklch(0.72_0.15_60)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Capacidad</p>
                    <p className="text-sm text-white/70">8 personas (máx. 15 visitantes)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="bg-[oklch(0.97_0.005_80)] border border-[oklch(0.9_0.005_250)] p-6 text-center">
              <MapPin className="w-8 h-8 text-[oklch(0.72_0.15_60)] mx-auto mb-3" />
              <p className="font-heading text-sm font-semibold text-[oklch(0.28_0.07_245)] mb-1">
                El Puerto de Santa María
              </p>
              <p className="text-xs text-[oklch(0.5_0.01_250)]">
                Cádiz, Andalucía, España
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" {...props}>
      <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.914 15.914 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.31 22.606c-.39 1.1-1.932 2.014-3.168 2.282-.846.18-1.95.324-5.668-1.218-4.762-1.972-7.824-6.81-8.062-7.126-.228-.316-1.916-2.55-1.916-4.864 0-2.314 1.214-3.452 1.644-3.924.39-.428 1.028-.624 1.638-.624.198 0 .376.01.536.018.47.02.706.048 1.016.788.39.928 1.338 3.264 1.454 3.502.118.238.236.558.076.876-.15.326-.282.528-.52.808-.238.28-.5.624-.714.838-.238.238-.486.496-.208.968.278.47 1.236 2.038 2.654 3.302 1.822 1.624 3.358 2.126 3.836 2.362.478.238.756.198 1.034-.118.278-.316 1.196-1.392 1.514-1.87.316-.478.634-.396 1.072-.238.438.158 2.772 1.308 3.248 1.546.478.238.796.356.914.554.118.198.118 1.148-.272 2.248z" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
