# Brainstorm de Diseño — Villa Campito

## Contexto
Sitio web para un alojamiento turístico de lujo en El Puerto de Santa María, Cádiz. Villa con piscina, jacuzzi, bar en la piscina, chozo de bambú africano, cama balinesa. Capacidad para 8 personas. Ambiente mediterráneo-andaluz con toques exóticos.

---

<response>
## Idea 1: "Costa Dorada" — Estética Mediterránea Contemporánea

<text>

**Movimiento de diseño:** Neo-Mediterranean — inspirado en la arquitectura costera andaluza moderna, con líneas limpias y materiales naturales.

**Principios fundamentales:**
1. Horizontalidad y amplitud: layouts que evocan la línea del horizonte marítimo.
2. Materialidad digital: texturas de piedra caliza, madera de teca y cerámica artesanal traducidas al entorno web.
3. Luz natural como protagonista: fondos claros con sombras suaves que simulan la luz del atardecer gaditano.

**Filosofía de color:**
- Azul profundo marino (#0a3d62) como ancla visual — evoca el Atlántico gaditano.
- Arena cálida (#f5f0e8) como fondo principal — no blanco puro, sino el tono de la playa de Valdelagrana.
- Terracota dorada (#e58e26) como acento — el sol del sur, la cerámica andaluza.
- Verde oliva apagado (#5a6e4e) como complemento — la vegetación mediterránea.

**Paradigma de layout:**
- Secciones de ancho completo con contenido asimétrico: texto a un lado, imagen al otro, alternando.
- Hero section con imagen de fondo a pantalla completa con overlay degradado sutil.
- Grid de 3 columnas para características, con iconografía personalizada.

**Elementos distintivos:**
1. Bordes redondeados orgánicos en las tarjetas (border-radius asimétricos tipo 20px 4px 20px 4px).
2. Separadores de sección con formas onduladas que evocan las olas del mar.

**Filosofía de interacción:**
- Transiciones suaves y lentas (400-600ms) que transmiten calma y relajación.
- Hover effects con ligero zoom y sombra elevada en las imágenes.
- Scroll reveal progresivo de los elementos.

**Animaciones:**
- Fade-in desde abajo al hacer scroll (staggered, 100ms entre elementos).
- Parallax suave en la sección hero.
- Transición de opacidad en las imágenes de la galería al hacer hover.

**Sistema tipográfico:**
- Títulos: Playfair Display (serif elegante) — peso 700 para h1, 600 para h2.
- Cuerpo: Source Sans 3 (sans-serif legible) — peso 400 regular, 600 para énfasis.
- Tamaños: h1 clamp(2.5rem, 5vw, 4rem), h2 clamp(1.8rem, 3vw, 2.5rem).

</text>
<probability>0.08</probability>
</response>

---

<response>
## Idea 2: "Bambú & Brisa" — Tropical Bohemio Refinado

<text>

**Movimiento de diseño:** Tropical Bohemian Luxury — inspirado en resorts boutique de Bali y Tulum, conectando con el chozo de bambú africano y la cama balinesa de la villa.

**Principios fundamentales:**
1. Naturaleza como framework: la estructura visual imita patrones orgánicos, no geométricos rígidos.
2. Contraste dramático: fondos oscuros con detalles dorados y vegetación.
3. Sensorialidad: cada sección debe evocar una experiencia sensorial diferente (frescor del agua, calidez del sol, aroma de la brisa).

**Filosofía de color:**
- Negro carbón (#1a1a2e) como fondo principal — elegancia nocturna, cielos estrellados del sur.
- Dorado cálido (#d4a853) como acento principal — lujo sin ostentación.
- Verde tropical (#2d5a3d) como color secundario — vegetación exuberante.
- Blanco crema (#faf8f5) para texto sobre fondos oscuros.

**Paradigma de layout:**
- Secciones full-bleed con imágenes que ocupan el 60% del viewport.
- Texto superpuesto con backdrop-blur sobre las imágenes.
- Layout en zigzag: imagen izquierda/texto derecha, luego invertido.
- Galería tipo masonry con bordes redondeados variados.

**Elementos distintivos:**
1. Líneas decorativas doradas finas que separan secciones (1px, con gradiente fade-out en los extremos).
2. Patrones sutiles de hojas tropicales como texturas de fondo en secciones alternas.

**Filosofía de interacción:**
- Movimientos fluidos y orgánicos, como el balanceo de una hamaca.
- Cursor personalizado con efecto de estela suave.
- Imágenes que se revelan con efecto de cortina lateral.

**Animaciones:**
- Reveal con clip-path desde el centro hacia afuera en las imágenes.
- Texto que aparece letra por letra en los títulos principales.
- Efecto de respiración (scale pulse suave) en el botón de reserva.

**Sistema tipográfico:**
- Títulos: Cormorant Garamond (serif refinada) — peso 600, tracking amplio (+0.05em).
- Cuerpo: Nunito Sans (sans-serif suave) — peso 400, line-height 1.8.
- Decorativo: Italiana para subtítulos de sección — peso 400, all-caps.

</text>
<probability>0.05</probability>
</response>

---

<response>
## Idea 3: "Sal y Sol" — Minimalismo Costero Andaluz

<text>

**Movimiento de diseño:** Coastal Minimalism — inspirado en la estética de las casas blancas de los pueblos de Cádiz, con la frescura del Atlántico y la calidez del flamenco.

**Principios fundamentales:**
1. Blanco como lienzo: los espacios en blanco son tan importantes como el contenido.
2. Fotografía como protagonista absoluta: el diseño se retira para que las imágenes de la villa hablen.
3. Ritmo visual: alternancia entre secciones densas y secciones de respiro, como el vaivén de las olas.

**Filosofía de color:**
- Blanco encalado (#fefefe) como fondo dominante — las paredes de los pueblos blancos.
- Azul Atlántico (#0a3d62) como color de texto y acentos principales — profundo, serio, confiable.
- Naranja atardecer (#e58e26) exclusivamente para CTAs y elementos de acción — urgencia cálida.
- Gris piedra (#8c8c8c) para texto secundario y bordes — la piedra ostionera de Cádiz.

**Paradigma de layout:**
- Layout editorial: secciones con márgenes amplios (max-width 1100px).
- Hero con imagen a sangre completa y texto centrado con tipografía grande.
- Secciones de características con layout de dos columnas desiguales (40/60).
- Tabla de tarifas limpia con líneas finas y mucho espacio entre filas.

**Elementos distintivos:**
1. Líneas horizontales finas azules que actúan como separadores entre secciones (evocando el horizonte marino).
2. Esquinas completamente rectas (border-radius: 0) en todos los elementos — limpieza absoluta.

**Filosofía de interacción:**
- Micro-interacciones precisas y rápidas (200-300ms).
- Hover con subrayado animado en los enlaces de navegación.
- Scroll suave entre secciones con navegación fija.

**Animaciones:**
- Fade-in sutil y rápido al entrar en viewport (opacity 0→1, translateY 20px→0).
- Imágenes de galería con efecto de zoom suave al hover (scale 1→1.05).
- Navegación sticky que reduce su tamaño al hacer scroll.

**Sistema tipográfico:**
- Títulos: Montserrat (geométrica, moderna) — peso 700, tracking -0.02em.
- Cuerpo: Open Sans (humanista, legible) — peso 400, line-height 1.7.
- Números y precios: Montserrat peso 600 — claridad en las tarifas.

</text>
<probability>0.07</probability>
</response>
