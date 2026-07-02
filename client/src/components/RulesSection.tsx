/*
 * RulesSection — Villa Campito
 * Design: Clean list with icons on sand background.
 * Content extracted from the normas image.
 */

import { motion } from "framer-motion";
import {
  Volume2, Music, Users, PartyPopper, Clock, Trash2, ShieldCheck, AlertTriangle
} from "lucide-react";

const RULES = [
  {
    icon: Volume2,
    title: "Normativa de ruidos",
    text: "Se debe cumplir en todo momento con las normativas referentes a ruidos y emisiones acústicas municipales.",
  },
  {
    icon: Music,
    title: "Aparatos de sonido",
    text: "Prohibido introducir en la villa cualquier aparato de sonido. La villa cuenta con uno propio limitado en volumen.",
  },
  {
    icon: Users,
    title: "Reuniones familiares",
    text: "Se permiten reuniones familiares y de amigos para el disfrute de la piscina, solárium, barbacoas y demás instalaciones.",
  },
  {
    icon: PartyPopper,
    title: "Fiestas",
    text: "Está totalmente prohibido cualquier tipo de fiesta que perturbe la convivencia vecinal.",
  },
  {
    icon: Users,
    title: "Capacidad",
    text: "Capacidad para 8 personas durmiendo. Puede haber hasta un máximo de 15 personas disfrutando de las instalaciones.",
  },
  {
    icon: Clock,
    title: "Horarios",
    text: "Check-in: 14:00 h — Check-out: 10:00 h. Consultar la posibilidad de otros horarios.",
  },
  {
    icon: Trash2,
    title: "Limpieza a la salida",
    text: "La propiedad hay que dejarla recogida a la salida y sin basura.",
  },
  {
    icon: ShieldCheck,
    title: "Fianza",
    text: "Inquilinos de menos de 30 años: 500€ de fianza para garantizar el cumplimiento de las normas y posibles deterioros.",
  },
];

export default function RulesSection() {
  return (
    <section id="normas" className="section-padding bg-[oklch(0.97_0.005_80)]">
      <div className="container">
        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-[2px] bg-[oklch(0.72_0.15_60)]" />
            <span className="text-[oklch(0.72_0.15_60)] text-sm font-medium uppercase tracking-[0.15em]">
              Normas
            </span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[oklch(0.28_0.07_245)] mb-4">
            Normas de la Villa
          </h2>
          <p className="text-[oklch(0.5_0.01_250)] text-lg max-w-2xl leading-relaxed">
            Para garantizar una estancia agradable para todos, te pedimos que respetes las siguientes normas durante tu visita.
          </p>
        </div>

        {/* Rules grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {RULES.map((rule, idx) => (
            <motion.div
              key={rule.title + idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              className="bg-white border border-[oklch(0.9_0.005_250)] p-6 flex gap-5 hover:border-[oklch(0.72_0.15_60)]/30 transition-colors"
            >
              <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-[oklch(0.97_0.005_80)]">
                <rule.icon className="w-5 h-5 text-[oklch(0.72_0.15_60)]" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-[oklch(0.28_0.07_245)] mb-1">
                  {rule.title}
                </h3>
                <p className="text-sm text-[oklch(0.5_0.01_250)] leading-relaxed">
                  {rule.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Important notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex items-start gap-4 bg-[oklch(0.72_0.15_60)]/10 border border-[oklch(0.72_0.15_60)]/20 p-6"
        >
          <AlertTriangle className="w-5 h-5 text-[oklch(0.72_0.15_60)] shrink-0 mt-0.5" />
          <p className="text-sm text-[oklch(0.28_0.07_245)] leading-relaxed">
            El incumplimiento de estas normas puede suponer la pérdida total o parcial de la fianza depositada. Agradecemos tu colaboración para mantener Villa Campito en las mejores condiciones.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
