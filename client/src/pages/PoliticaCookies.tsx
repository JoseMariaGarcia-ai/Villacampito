import { ArrowLeft } from "lucide-react";

export default function PoliticaCookies() {
  return (
    <div className="min-h-screen bg-[oklch(0.97_0.01_245)]">
      {/* Header */}
      <div className="bg-[oklch(0.28_0.07_245)] text-white py-8">
        <div className="container">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </a>
          <h1 className="font-heading text-3xl font-bold">Política de Cookies</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12 max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              1. ¿Qué son las cookies?
            </h2>
            <p>
              Las cookies son pequeños archivos de texto que los sitios web almacenan en su dispositivo (ordenador, tableta o teléfono móvil) cuando los visita. Se utilizan ampliamente para hacer que los sitios web funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              2. ¿Qué cookies utilizamos?
            </h2>
            <p>En este sitio web utilizamos los siguientes tipos de cookies:</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Tipo</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Finalidad</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Técnicas</td>
                    <td className="border border-gray-200 px-3 py-2">Necesarias para el funcionamiento del sitio web y la navegación.</td>
                    <td className="border border-gray-200 px-3 py-2">Sesión</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2">Analíticas</td>
                    <td className="border border-gray-200 px-3 py-2">Permiten medir y analizar la navegación de los usuarios para mejorar el servicio.</td>
                    <td className="border border-gray-200 px-3 py-2">Hasta 12 meses</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Funcionales</td>
                    <td className="border border-gray-200 px-3 py-2">Recuerdan las preferencias del usuario para personalizar la experiencia.</td>
                    <td className="border border-gray-200 px-3 py-2">Hasta 12 meses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              3. ¿Cómo gestionar las cookies?
            </h2>
            <p>
              Puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones del navegador instalado en su dispositivo. A continuación, le indicamos los enlaces de ayuda de los principales navegadores:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>
                <strong>Google Chrome:</strong>{" "}
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[oklch(0.50_0.15_245)] hover:underline">
                  Configuración de cookies en Chrome
                </a>
              </li>
              <li>
                <strong>Mozilla Firefox:</strong>{" "}
                <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="text-[oklch(0.50_0.15_245)] hover:underline">
                  Configuración de cookies en Firefox
                </a>
              </li>
              <li>
                <strong>Safari:</strong>{" "}
                <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[oklch(0.50_0.15_245)] hover:underline">
                  Configuración de cookies en Safari
                </a>
              </li>
              <li>
                <strong>Microsoft Edge:</strong>{" "}
                <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[oklch(0.50_0.15_245)] hover:underline">
                  Configuración de cookies en Edge
                </a>
              </li>
            </ul>
            <p className="mt-3">
              Si desactiva las cookies, es posible que algunas funcionalidades del sitio web no estén disponibles.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              4. Titular del sitio web
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Titular:</strong> PPLT INVERSIONES 2022, S.L.</li>
              <li><strong>CIF:</strong> B72461551</li>
              <li><strong>Domicilio:</strong> Avda. de las Adelfas, 30, El Puerto de Santa María, Cádiz</li>
              <li><strong>Teléfono:</strong> 640 723 374</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              5. Actualización de la política de cookies
            </h2>
            <p>
              Esta política de cookies puede ser actualizada en cualquier momento para adaptarse a novedades normativas o cambios en nuestras actividades. Le recomendamos revisar esta política periódicamente.
            </p>
          </section>

          <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
            Última actualización: abril 2026
          </p>
        </div>
      </div>
    </div>
  );
}
