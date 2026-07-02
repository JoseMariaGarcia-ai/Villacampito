/*
 * PricingSection — Villa Campito
 * Design: Accordion pricing by season + sticky calendar.
 * Calendar with manually-set occupied dates (red) from owner's document.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, CalendarDays, Euro, AlertTriangle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

/* ─── Types ─── */
interface DayInfo {
  day: number;
  occupied: boolean;
}

/* ─── Calendar constants ─── */
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAY_NAMES = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

function pad(n: number) { return n.toString().padStart(2, "0"); }

function getMonthDays(year: number, month: number, occupiedSet: Set<string>): DayInfo[] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const days: DayInfo[] = [];
  for (let i = 0; i < startOffset; i++) {
    days.push({ day: 0, occupied: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month)}-${pad(d)}`;
    days.push({ day: d, occupied: occupiedSet.has(dateStr) });
  }
  return days;
}

/* ─── Calendar Component ─── */
function Calendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = trpc.calendar.getOccupiedDates.useQuery();
  const occupiedSet = useMemo(() => new Set(data?.dates ?? []), [data]);

  const days = getMonthDays(year, month, occupiedSet);

  if (isLoading) {
    return (
      <div className="bg-white border border-[oklch(0.9_0.005_250)] p-5 sm:p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.5_0.01_250)]" />
      </div>
    );
  }

  const prev = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const next = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const today = new Date();
  const isPastDay = (day: number) => {
    if (year < today.getFullYear()) return true;
    if (year === today.getFullYear() && month < today.getMonth() + 1) return true;
    if (year === today.getFullYear() && month === today.getMonth() + 1 && day < today.getDate()) return true;
    return false;
  };

  const isToday = (day: number) => {
    return year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate();
  };

  return (
    <div className="bg-white border border-[oklch(0.9_0.005_250)] p-5 sm:p-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prev} className="p-2 hover:bg-[oklch(0.97_0.005_80)] transition-colors rounded" aria-label="Mes anterior">
          <ChevronLeft className="w-5 h-5 text-[oklch(0.28_0.07_245)]" />
        </button>
        <h4 className="font-heading text-lg font-semibold text-[oklch(0.28_0.07_245)]">
          {MONTH_NAMES[month - 1]} {year}
        </h4>
        <button onClick={next} className="p-2 hover:bg-[oklch(0.97_0.005_80)] transition-colors rounded" aria-label="Mes siguiente">
          <ChevronRight className="w-5 h-5 text-[oklch(0.28_0.07_245)]" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-[oklch(0.5_0.01_250)] uppercase py-1.5">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => (
          <div
            key={i}
            className={`text-center py-2 sm:py-2.5 text-sm rounded transition-colors ${
              d.day === 0
                ? ""
                : d.occupied
                ? "bg-red-500/15 text-red-600 font-bold line-through"
                : isPastDay(d.day)
                ? "text-[oklch(0.7_0.01_250)]"
                : isToday(d.day)
                ? "bg-[oklch(0.28_0.07_245)] text-white font-semibold"
                : "text-[oklch(0.28_0.07_245)] hover:bg-[oklch(0.97_0.005_80)]"
            }`}
          >
            {d.day > 0 ? d.day : ""}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-5 pt-4 border-t border-[oklch(0.9_0.005_250)]">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-[oklch(0.97_0.005_80)] border border-[oklch(0.9_0.005_250)]" />
          <span className="text-[11px] text-[oklch(0.5_0.01_250)]">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-red-500/15 border border-red-200" />
          <span className="text-[11px] text-[oklch(0.5_0.01_250)]">Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-[oklch(0.28_0.07_245)]" />
          <span className="text-[11px] text-[oklch(0.5_0.01_250)]">Hoy</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Pricing Data — All seasons 2026 ─── */
const PRICING_DATA = [
  {
    period: "Enero — Febrero — Marzo",
    rows: [
      { type: "Día entre semana", price: "250€", note: "Más de 1 día: consultar" },
      { type: "Viernes", price: "350€", note: "" },
      { type: "Sábado", price: "350€", note: "" },
      { type: "Domingo", price: "250€", note: "" },
      { type: "Fin de semana (2 días)", price: "550€", note: "" },
      { type: "Fin de semana (3 días)", price: "650€", note: "" },
      { type: "Semanas y quincenas", price: "Consultar", note: "" },
    ],
  },
  {
    period: "Abril",
    rows: [
      { type: "Día entre semana", price: "250€", note: "Más de 1 día: consultar" },
      { type: "Viernes", price: "450€", note: "" },
      { type: "Sábado", price: "450€", note: "" },
      { type: "Domingo", price: "300€", note: "" },
      { type: "Fin de semana (2 días)", price: "650€", note: "" },
      { type: "Fin de semana (3 días)", price: "750€", note: "" },
      { type: "Semanas y quincenas", price: "Consultar", note: "" },
    ],
  },
  {
    period: "1 Mayo — 11 Junio",
    rows: [
      { type: "Día entre semana", price: "350€", note: "Más de 1 día: consultar" },
      { type: "Fin de semana (2 días)", price: "1.050€", note: "" },
      { type: "Fin de semana (3 días)", price: "1.250€", note: "" },
      { type: "Semana (lunes a lunes)", price: "2.050€", note: "" },
      { type: "Quincenas", price: "Consultar", note: "" },
    ],
  },
  {
    period: "12 Junio — 3 Agosto",
    rows: [
      { type: "Día entre semana", price: "450€", note: "Más de 1 día: consultar" },
      { type: "Fin de semana (2 días)", price: "1.550€", note: "" },
      { type: "Fin de semana (3 días)", price: "1.850€", note: "" },
      { type: "Semana (lunes a lunes)", price: "3.050€", note: "" },
      { type: "Quincenas", price: "Consultar", note: "" },
    ],
  },
  {
    period: "Agosto",
    rows: [
      { type: "Día entre semana", price: "450€", note: "Más de 1 día: consultar" },
      { type: "Fin de semana (2 días)", price: "1.650€", note: "" },
      { type: "Fin de semana (3 días)", price: "2.050€", note: "" },
      { type: "Semana (lunes a lunes)", price: "3.500€", note: "" },
      { type: "Quincenas", price: "Consultar", note: "" },
    ],
  },
  {
    period: "1 — 15 Septiembre",
    rows: [
      { type: "Día entre semana", price: "350€", note: "Más de 1 día: consultar" },
      { type: "Fin de semana (2 días)", price: "1.250€", note: "" },
      { type: "Fin de semana (3 días)", price: "1.550€", note: "" },
      { type: "Semana (lunes a lunes)", price: "2.050€", note: "" },
      { type: "Quincenas", price: "Consultar", note: "" },
    ],
  },
  {
    period: "15 — 30 Septiembre",
    rows: [
      { type: "Día entre semana", price: "250€", note: "Más de 1 día: consultar" },
      { type: "Fin de semana (2 días)", price: "1.050€", note: "" },
      { type: "Fin de semana (3 días)", price: "1.250€", note: "" },
      { type: "Semana (lunes a lunes)", price: "1.550€", note: "" },
      { type: "Quincenas", price: "Consultar", note: "" },
    ],
  },
  {
    period: "Octubre — Noviembre — Diciembre",
    rows: [
      { type: "Día entre semana", price: "250€", note: "Más de 1 día: consultar" },
      { type: "Viernes", price: "350€", note: "" },
      { type: "Sábado", price: "350€", note: "" },
      { type: "Domingo", price: "250€", note: "" },
      { type: "Fin de semana (2 días)", price: "550€", note: "" },
      { type: "Fin de semana (3 días)", price: "650€", note: "" },
      { type: "Semanas y quincenas", price: "Consultar", note: "" },
    ],
  },
];

/* ─── Accordion Item ─── */
function PricingAccordion({ block, index }: { block: typeof PRICING_DATA[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="bg-white border border-[oklch(0.9_0.005_250)] overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-[oklch(0.98_0.003_80)] transition-colors cursor-pointer"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <Euro className="w-4 h-4 text-[oklch(0.72_0.15_60)] flex-shrink-0" />
          <h3 className="font-heading text-base font-bold text-[oklch(0.28_0.07_245)] text-left">
            {block.period}
          </h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-[oklch(0.5_0.01_250)] transition-transform duration-300 flex-shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-[oklch(0.9_0.005_250)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[oklch(0.9_0.005_250)]">
                      <th className="text-left px-5 py-2.5 font-semibold text-[oklch(0.5_0.01_250)] uppercase text-[10px] tracking-wide">
                        Concepto
                      </th>
                      <th className="text-right px-5 py-2.5 font-semibold text-[oklch(0.5_0.01_250)] uppercase text-[10px] tracking-wide">
                        Precio
                      </th>
                      <th className="text-right px-5 py-2.5 font-semibold text-[oklch(0.5_0.01_250)] uppercase text-[10px] tracking-wide hidden sm:table-cell">
                        Nota
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row) => (
                      <tr key={row.type} className="border-b border-[oklch(0.95_0.005_250)] last:border-0 hover:bg-[oklch(0.98_0.003_80)] transition-colors">
                        <td className="px-5 py-3 text-[oklch(0.28_0.07_245)] font-medium text-sm">
                          {row.type}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-[oklch(0.28_0.07_245)] text-sm">
                          {row.price}
                        </td>
                        <td className="px-5 py-3 text-right text-[oklch(0.5_0.01_250)] text-xs hidden sm:table-cell">
                          {row.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Component ─── */
export default function PricingSection() {
  return (
    <section id="tarifas" className="section-padding bg-[oklch(0.97_0.005_80)]">
      <div className="container">
        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-[2px] bg-[oklch(0.72_0.15_60)]" />
            <span className="text-[oklch(0.72_0.15_60)] text-sm font-medium uppercase tracking-[0.15em]">
              Tarifas y disponibilidad
            </span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[oklch(0.28_0.07_245)] mb-4">
            Precios 2026
          </h2>
          <p className="text-[oklch(0.5_0.01_250)] text-lg max-w-2xl leading-relaxed">
            Consulta nuestras tarifas por temporada y comprueba la disponibilidad en el calendario.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">
          {/* Pricing Accordion */}
          <div className="lg:col-span-3 space-y-3">
            {PRICING_DATA.map((block, idx) => (
              <PricingAccordion key={block.period} block={block} index={idx} />
            ))}

            {/* Special note */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-[oklch(0.72_0.15_60)]/10 border border-[oklch(0.72_0.15_60)]/30 p-5 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-[oklch(0.72_0.15_60)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-heading font-bold text-[oklch(0.28_0.07_245)] text-sm mb-1">
                  Fechas especiales — Consultar
                </p>
                <p className="text-[oklch(0.5_0.01_250)] text-sm leading-relaxed">
                  Puentes, Navidad, Fin de Año, Festivos, Mundial de Motociclismo, Puro Latino y Feria tienen precios especiales. Consúltanos por WhatsApp.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="sticky top-24">
              <div className="flex items-center gap-3 mb-4">
                <CalendarDays className="w-5 h-5 text-[oklch(0.72_0.15_60)]" />
                <h3 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)]">
                  Disponibilidad
                </h3>
              </div>
              <Calendar />
              <div className="mt-6">
                <a
                  href="https://wa.me/34640723374?text=Hola%2C%20me%20gustar%C3%ADa%20consultar%20la%20disponibilidad%20de%20Villa%20Campito.%20%C2%A1Gracias!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-[#25D366] text-white font-heading font-semibold text-sm uppercase tracking-wide hover:bg-[#20BD5A] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-5 h-5"><path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.914 15.914 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.31 22.606c-.39 1.1-1.932 2.014-3.168 2.282-.846.18-1.95.324-5.668-1.218-4.762-1.972-7.824-6.81-8.062-7.126-.228-.316-1.916-2.55-1.916-4.864 0-2.314 1.214-3.452 1.644-3.924.39-.428 1.028-.624 1.638-.624.198 0 .376.01.536.018.47.02.706.048 1.016.788.39.928 1.338 3.264 1.454 3.502.118.238.236.558.076.876-.15.326-.282.528-.52.808-.238.28-.5.624-.714.838-.238.238-.486.496-.208.968.278.47 1.236 2.038 2.654 3.302 1.822 1.624 3.358 2.126 3.836 2.362.478.238.756.198 1.034-.118.278-.316 1.196-1.392 1.514-1.87.316-.478.634-.396 1.072-.238.438.158 2.772 1.308 3.248 1.546.478.238.796.356.914.554.118.198.118 1.148-.272 2.248z"/></svg>
                  Consultar disponibilidad
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
