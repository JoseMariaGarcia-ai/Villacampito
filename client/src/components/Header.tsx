/*
 * Header — Villa Campito
 * Design: "Sal y Sol" Coastal Minimalism
 * Sticky nav that shrinks on scroll. White bg, navy text, sharp edges.
 * Mobile hamburger menu with slide-in panel.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MapPin } from "lucide-react";

const NAV_ITEMS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Características", href: "#caracteristicas" },
  { label: "Tarifas y Disponibilidad", href: "#tarifas" },
  { label: "Galería", href: "#galeria" },
  { label: "Vídeos", href: "#videos" },
  { label: "Normas", href: "#normas" },
  { label: "Contacto", href: "#contacto" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-sm shadow-[0_1px_0_0_rgba(10,61,98,0.08)]"
          : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between"
        style={{ height: scrolled ? "64px" : "80px", transition: "height 0.3s ease" }}
      >
        {/* Logo */}
        <a
          href="#inicio"
          onClick={(e) => { e.preventDefault(); handleNavClick("#inicio"); }}
          className="flex items-center gap-2 group"
        >
          <div className={`flex items-center gap-2 transition-colors duration-300 ${
            scrolled ? "text-[oklch(0.28_0.07_245)]" : "text-white"
          }`}>
            <MapPin className="w-5 h-5" strokeWidth={2.5} />
            <span className="font-heading text-lg font-bold tracking-tight">
              Villa Campito
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
              className={`relative text-sm font-medium tracking-wide uppercase transition-colors duration-300 group ${
                scrolled
                  ? "text-[oklch(0.28_0.07_245)] hover:text-[oklch(0.72_0.15_60)]"
                  : "text-white/90 hover:text-white"
              }`}
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[oklch(0.72_0.15_60)] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          <a
            href="https://wa.me/34640723374?text=Hola%2C%20me%20gustar%C3%ADa%20obtener%20informaci%C3%B3n%20sobre%20Villa%20Campito%20y%20disponibilidad.%20%C2%A1Gracias!"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-5 py-2 bg-[#25D366] text-white text-sm font-semibold uppercase tracking-wide hover:bg-[#20BD5A] transition-colors duration-300 inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-4 h-4"><path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.914 15.914 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.31 22.606c-.39 1.1-1.932 2.014-3.168 2.282-.846.18-1.95.324-5.668-1.218-4.762-1.972-7.824-6.81-8.062-7.126-.228-.316-1.916-2.55-1.916-4.864 0-2.314 1.214-3.452 1.644-3.924.39-.428 1.028-.624 1.638-.624.198 0 .376.01.536.018.47.02.706.048 1.016.788.39.928 1.338 3.264 1.454 3.502.118.238.236.558.076.876-.15.326-.282.528-.52.808-.238.28-.5.624-.714.838-.238.238-.486.496-.208.968.278.47 1.236 2.038 2.654 3.302 1.822 1.624 3.358 2.126 3.836 2.362.478.238.756.198 1.034-.118.278-.316 1.196-1.392 1.514-1.87.316-.478.634-.396 1.072-.238.438.158 2.772 1.308 3.248 1.546.478.238.796.356.914.554.118.198.118 1.148-.272 2.248z"/></svg>
            Reservar
          </a>
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`lg:hidden p-2 transition-colors duration-300 ${
            scrolled ? "text-[oklch(0.28_0.07_245)]" : "text-white"
          }`}
          aria-label="Menú"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-white border-t border-[oklch(0.9_0.005_250)]"
          >
            <nav className="container py-6 flex flex-col gap-4">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
                  className="text-[oklch(0.28_0.07_245)] text-base font-medium uppercase tracking-wide py-2 border-b border-[oklch(0.9_0.005_250)] last:border-0 hover:text-[oklch(0.72_0.15_60)] transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <a
                href="https://wa.me/34640723374?text=Hola%2C%20me%20gustar%C3%ADa%20obtener%20informaci%C3%B3n%20sobre%20Villa%20Campito%20y%20disponibilidad.%20%C2%A1Gracias!"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 px-5 py-3 bg-[#25D366] text-white text-center text-sm font-semibold uppercase tracking-wide hover:bg-[#20BD5A] transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-4 h-4"><path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.914 15.914 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.31 22.606c-.39 1.1-1.932 2.014-3.168 2.282-.846.18-1.95.324-5.668-1.218-4.762-1.972-7.824-6.81-8.062-7.126-.228-.316-1.916-2.55-1.916-4.864 0-2.314 1.214-3.452 1.644-3.924.39-.428 1.028-.624 1.638-.624.198 0 .376.01.536.018.47.02.706.048 1.016.788.39.928 1.338 3.264 1.454 3.502.118.238.236.558.076.876-.15.326-.282.528-.52.808-.238.28-.5.624-.714.838-.238.238-.486.496-.208.968.278.47 1.236 2.038 2.654 3.302 1.822 1.624 3.358 2.126 3.836 2.362.478.238.756.198 1.034-.118.278-.316 1.196-1.392 1.514-1.87.316-.478.634-.396 1.072-.238.438.158 2.772 1.308 3.248 1.546.478.238.796.356.914.554.118.198.118 1.148-.272 2.248z"/></svg>
                Reservar por WhatsApp
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
