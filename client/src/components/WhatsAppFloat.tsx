/*
 * WhatsAppFloat — Villa Campito
 * Floating WhatsApp button visible on all pages.
 * Phone: 640723374 | Text: "Info y reservas WhatsApp"
 * Design: Green WhatsApp brand color, fixed bottom-right, with label.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WHATSAPP_NUMBER = "34640723374";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hola, me gustaría obtener información sobre Villa Campito y disponibilidad. ¡Gracias!"
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

export default function WhatsAppFloat() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    // Show after a short delay so it doesn't appear instantly on load
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 sm:bottom-6 z-[9999] flex items-center gap-0 max-sm:bottom-16"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Label that slides out on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, x: 10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: "auto" }}
                exit={{ opacity: 0, x: 10, width: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <span className="block whitespace-nowrap bg-white text-[oklch(0.28_0.07_245)] text-sm font-semibold px-4 py-3 mr-2 shadow-lg border border-[oklch(0.92_0.005_250)]"
                  style={{ borderRadius: "4px" }}
                >
                  Info y reservas WhatsApp
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* WhatsApp button */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Info y reservas WhatsApp"
            className="relative flex items-center justify-center w-16 h-16 bg-[#25D366] hover:bg-[#20BD5A] shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_28px_rgba(37,211,102,0.55)] transition-all duration-300"
            style={{ borderRadius: "50%" }}
          >
            {/* WhatsApp SVG icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              className="w-8 h-8"
              fill="white"
            >
              <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.914 15.914 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.31 22.606c-.39 1.1-1.932 2.014-3.168 2.282-.846.18-1.95.324-5.668-1.218-4.762-1.972-7.824-6.81-8.062-7.126-.228-.316-1.916-2.55-1.916-4.864 0-2.314 1.214-3.452 1.644-3.924.39-.428 1.028-.624 1.638-.624.198 0 .376.01.536.018.47.02.706.048 1.016.788.39.928 1.338 3.264 1.454 3.502.118.238.236.558.076.876-.15.326-.282.528-.52.808-.238.28-.5.624-.714.838-.238.238-.486.496-.208.968.278.47 1.236 2.038 2.654 3.302 1.822 1.624 3.358 2.126 3.836 2.362.478.238.756.198 1.034-.118.278-.316 1.196-1.392 1.514-1.87.316-.478.634-.396 1.072-.238.438.158 2.772 1.308 3.248 1.546.478.238.796.356.914.554.118.198.118 1.148-.272 2.248z" />
            </svg>

            {/* Pulse animation ring */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
