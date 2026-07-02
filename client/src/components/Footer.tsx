/*
 * Footer — Villa Campito
 * Design: Navy background, white text, clean and minimal.
 * WhatsApp as primary contact method.
 */

import { MapPin } from "lucide-react";

const NAV_LINKS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Características", href: "#caracteristicas" },
  { label: "Tarifas", href: "#tarifas" },
  { label: "Galería", href: "#galeria" },
  { label: "Vídeos", href: "#videos" },
  { label: "Normas", href: "#normas" },
  { label: "Contacto", href: "#contacto" },
];

export default function Footer() {
  const handleClick = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-[oklch(0.28_0.07_245)] text-white">
      {/* Top divider line */}
      <div className="h-1 bg-[oklch(0.72_0.15_60)]" />

      <div className="container py-12">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[oklch(0.72_0.15_60)]" />
              <span className="font-heading text-lg font-bold">Villa Campito</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs mb-5">
              Alojamiento turístico de lujo en El Puerto de Santa María, Cádiz. Disfruta de piscina, jacuzzi, barbacoa y la brisa del Atlántico.
            </p>
            {/* WhatsApp link */}
            <a
              href="https://wa.me/34640723374?text=Hola%2C%20me%20gustar%C3%ADa%20obtener%20informaci%C3%B3n%20sobre%20Villa%20Campito.%20%C2%A1Gracias!"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20BD5A] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-4 h-4"><path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.914 15.914 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.31 22.606c-.39 1.1-1.932 2.014-3.168 2.282-.846.18-1.95.324-5.668-1.218-4.762-1.972-7.824-6.81-8.062-7.126-.228-.316-1.916-2.55-1.916-4.864 0-2.314 1.214-3.452 1.644-3.924.39-.428 1.028-.624 1.638-.624.198 0 .376.01.536.018.47.02.706.048 1.016.788.39.928 1.338 3.264 1.454 3.502.118.238.236.558.076.876-.15.326-.282.528-.52.808-.238.28-.5.624-.714.838-.238.238-.486.496-.208.968.278.47 1.236 2.038 2.654 3.302 1.822 1.624 3.358 2.126 3.836 2.362.478.238.756.198 1.034-.118.278-.316 1.196-1.392 1.514-1.87.316-.478.634-.396 1.072-.238.438.158 2.772 1.308 3.248 1.546.478.238.796.356.914.554.118.198.118 1.148-.272 2.248z"/></svg>
              640 723 374
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-heading text-sm font-bold uppercase tracking-wide mb-4 text-white/80">
              Navegación
            </h4>
            <nav className="grid grid-cols-2 gap-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleClick(link.href); }}
                  className="text-sm text-white/50 hover:text-[oklch(0.72_0.15_60)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-heading text-sm font-bold uppercase tracking-wide mb-4 text-white/80">
              Información
            </h4>
            <div className="space-y-3 text-sm text-white/50">
              <p>PPLT INVERSIONES 2022, S.L.</p>
              <p>CIF: B72461551</p>
              <p>Avda. de las Adelfas, 30</p>
              <p>El Puerto de Santa María, Cádiz</p>
              <p>Check-in: 14:00 h / Check-out: 10:00 h</p>
              <p>Capacidad: 8 personas</p>
              <div className="pt-2">
                <p className="text-white/70 font-medium mb-1">Info y reservas:</p>
                <a
                  href="https://wa.me/34640723374"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366] hover:text-[#20BD5A] transition-colors inline-flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-3.5 h-3.5"><path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.914 15.914 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.31 22.606c-.39 1.1-1.932 2.014-3.168 2.282-.846.18-1.95.324-5.668-1.218-4.762-1.972-7.824-6.81-8.062-7.126-.228-.316-1.916-2.55-1.916-4.864 0-2.314 1.214-3.452 1.644-3.924.39-.428 1.028-.624 1.638-.624.198 0 .376.01.536.018.47.02.706.048 1.016.788.39.928 1.338 3.264 1.454 3.502.118.238.236.558.076.876-.15.326-.282.528-.52.808-.238.28-.5.624-.714.838-.238.238-.486.496-.208.968.278.47 1.236 2.038 2.654 3.302 1.822 1.624 3.358 2.126 3.836 2.362.478.238.756.198 1.034-.118.278-.316 1.196-1.392 1.514-1.87.316-.478.634-.396 1.072-.238.438.158 2.772 1.308 3.248 1.546.478.238.796.356.914.554.118.198.118 1.148-.272 2.248z"/></svg>
                  WhatsApp: 640 723 374
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} PPLT INVERSIONES 2022, S.L. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <a href="/aviso-legal" className="hover:text-white/60 transition-colors">
              Aviso legal
            </a>
            <span className="text-white/20">|</span>
            <a href="/politica-privacidad" className="hover:text-white/60 transition-colors">
              Política de privacidad
            </a>
            <span className="text-white/20">|</span>
            <a href="/politica-cookies" className="hover:text-white/60 transition-colors">
              Política de cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
