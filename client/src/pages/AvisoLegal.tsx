import { ArrowLeft } from "lucide-react";

export default function AvisoLegal() {
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
          <h1 className="font-heading text-3xl font-bold">Aviso Legal</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12 max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              1. Datos identificativos del titular
            </h2>
            <p>
              En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), se facilitan los siguientes datos:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li><strong>Titular:</strong> PPLT INVERSIONES 2022, S.L.</li>
              <li><strong>CIF:</strong> B72461551</li>
              <li><strong>Domicilio:</strong> Avda. de las Adelfas, 30, El Puerto de Santa María, Cádiz</li>
              <li><strong>Teléfono de contacto:</strong> 640 723 374</li>
              <li><strong>Actividad:</strong> Alojamiento turístico</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              2. Objeto
            </h2>
            <p>
              El presente aviso legal regula el uso y utilización del sitio web <strong>villacampito.com</strong>, del que es titular PPLT INVERSIONES 2022, S.L. La navegación por el sitio web atribuye la condición de usuario del mismo e implica la aceptación plena y sin reservas de todas y cada una de las disposiciones incluidas en este aviso legal.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              3. Condiciones de uso
            </h2>
            <p>
              El usuario se compromete a hacer un uso adecuado de los contenidos y servicios que se ofrecen a través de este sitio web y a no emplearlos para incurrir en actividades ilícitas o contrarias a la buena fe y al ordenamiento legal. El usuario se abstendrá de realizar cualquier conducta que pudiera dañar la imagen, los intereses y los derechos de PPLT INVERSIONES 2022, S.L. o de terceros.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              4. Propiedad intelectual e industrial
            </h2>
            <p>
              Todos los contenidos del sitio web, incluyendo textos, fotografías, gráficos, imágenes, iconos, tecnología, software, enlaces y demás contenidos audiovisuales o sonoros, así como su diseño gráfico y códigos fuente, son propiedad intelectual de PPLT INVERSIONES 2022, S.L. o de terceros, sin que puedan entenderse cedidos al usuario ninguno de los derechos de explotación reconocidos por la normativa vigente en materia de propiedad intelectual.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              5. Exclusión de responsabilidad
            </h2>
            <p>
              PPLT INVERSIONES 2022, S.L. no se hace responsable de los daños y perjuicios de cualquier naturaleza que pudieran derivarse del uso de los servicios y contenidos del sitio web por parte del usuario. Asimismo, no se hace responsable de los daños que pudieran derivarse de la utilización de versiones no actualizadas de navegadores.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              6. Legislación aplicable y jurisdicción
            </h2>
            <p>
              Para la resolución de todas las controversias o cuestiones relacionadas con el presente sitio web o de las actividades en él desarrolladas, será de aplicación la legislación española, a la que se someten expresamente las partes, siendo competentes para la resolución de todos los conflictos derivados o relacionados con su uso los Juzgados y Tribunales de Cádiz.
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
