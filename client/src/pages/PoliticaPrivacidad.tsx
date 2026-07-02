import { ArrowLeft } from "lucide-react";

export default function PoliticaPrivacidad() {
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
          <h1 className="font-heading text-3xl font-bold">Política de Privacidad</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12 max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              1. Responsable del tratamiento
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Responsable:</strong> PPLT INVERSIONES 2022, S.L.</li>
              <li><strong>CIF:</strong> B72461551</li>
              <li><strong>Domicilio:</strong> Avda. de las Adelfas, 30, El Puerto de Santa María, Cádiz</li>
              <li><strong>Teléfono:</strong> 640 723 374</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              2. Finalidad del tratamiento de datos
            </h2>
            <p>
              En PPLT INVERSIONES 2022, S.L. tratamos la información que nos facilitan las personas interesadas con las siguientes finalidades:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>Gestionar las solicitudes de información y reservas realizadas a través del sitio web o WhatsApp.</li>
              <li>Enviar comunicaciones comerciales relacionadas con nuestros servicios de alojamiento turístico, siempre que el usuario haya dado su consentimiento.</li>
              <li>Gestionar la relación contractual derivada de la reserva y estancia en el alojamiento.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              3. Legitimación
            </h2>
            <p>
              La base legal para el tratamiento de sus datos es el consentimiento del interesado, otorgado al ponerse en contacto con nosotros a través de los formularios o canales de comunicación disponibles, así como la ejecución de un contrato en el caso de reservas confirmadas.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              4. Conservación de los datos
            </h2>
            <p>
              Los datos personales proporcionados se conservarán mientras se mantenga la relación comercial o durante los años necesarios para cumplir con las obligaciones legales. Cuando ya no sean necesarios para la finalidad para la que fueron recabados, se suprimirán con las medidas de seguridad adecuadas.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              5. Comunicación de datos a terceros
            </h2>
            <p>
              No se comunicarán datos a terceros, salvo obligación legal. No se realizan transferencias internacionales de datos.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              6. Derechos del interesado
            </h2>
            <p>
              Cualquier persona tiene derecho a obtener confirmación sobre si en PPLT INVERSIONES 2022, S.L. estamos tratando datos personales que le conciernan, o no. Las personas interesadas tienen derecho a:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li><strong>Acceso:</strong> solicitar información sobre sus datos personales tratados.</li>
              <li><strong>Rectificación:</strong> solicitar la corrección de datos inexactos.</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de sus datos cuando ya no sean necesarios.</li>
              <li><strong>Limitación:</strong> solicitar la limitación del tratamiento de sus datos.</li>
              <li><strong>Portabilidad:</strong> recibir sus datos en un formato estructurado y de uso común.</li>
              <li><strong>Oposición:</strong> oponerse al tratamiento de sus datos.</li>
            </ul>
            <p className="mt-3">
              Para ejercer estos derechos, puede dirigirse a PPLT INVERSIONES 2022, S.L. a través del teléfono 640 723 374 o en la dirección Avda. de las Adelfas, 30, El Puerto de Santa María, Cádiz. También tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[oklch(0.28_0.07_245)] mb-3">
              7. Seguridad de los datos
            </h2>
            <p>
              PPLT INVERSIONES 2022, S.L. ha adoptado las medidas técnicas y organizativas necesarias para garantizar la seguridad de los datos de carácter personal y evitar su alteración, pérdida, tratamiento o acceso no autorizado, habida cuenta del estado de la tecnología, la naturaleza de los datos almacenados y los riesgos a que están expuestos.
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
