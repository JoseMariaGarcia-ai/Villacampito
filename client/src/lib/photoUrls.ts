/*
 * photoUrls.ts - Villa Campito
 *
 * Local paths (served from client/public/media/) for all real photos and
 * videos of the villa. These used to point to expiring signed URLs on
 * Manus's CDN (private-us-east-1.manuscdn.com, valid until 2027-02-23);
 * run `node scripts/download-media.mjs` once to download the original
 * files into client/public/media/ before that date.
 */

export const EXT_VISTA_GENERAL = "/media/exterior/ext-vista-general.webp";
export const EXT_PISCINA_BAR = "/media/exterior/ext-piscina-bar.webp";
export const EXT_CAMA_BALINESA = "/media/exterior/ext-cama-balinesa.webp";
export const EXT_PISCINA_LATERAL = "/media/exterior/ext-piscina-lateral.webp";
export const EXT_CHOZO_BAMBU = "/media/exterior/ext-chozo-bambu.webp";
export const EXT_TUMBONAS = "/media/exterior/ext-tumbonas.webp";
export const EXT_BARBACOA = "/media/exterior/ext-barbacoa.webp";
export const EXT_JARDIN_DETALLE = "/media/exterior/ext-jardin-detalle.webp";
export const EXT_PANORAMICA = "/media/exterior/ext-panoramica.webp";
export const EXT_PISCINA_NOCHE = "/media/exterior/ext-piscina-noche.webp";
export const EXT_DETALLE_1 = "/media/exterior/ext-detalle-1.webp";
export const EXT_ZONA_RELAX = "/media/exterior/ext-zona-relax.webp";
export const EXT_FACHADA = "/media/exterior/ext-fachada.webp";
export const EXT_JARDIN = "/media/exterior/ext-jardin.webp";
export const EXT_PISCINA_DETALLE = "/media/exterior/ext-piscina-detalle.webp";
export const EXT_ZONA_2 = "/media/exterior/ext-zona-2.webp";
export const EXT_GENERAL_2 = "/media/exterior/ext-general-2.webp";
export const EXT_DETALLE_2 = "/media/exterior/ext-detalle-2.webp";
export const EXT_ADICIONAL = "/media/exterior/ext-adicional.webp";

export const INT_DORMITORIO_PRINCIPAL = "/media/interior/int-dormitorio-principal.webp";
export const INT_COCINA = "/media/interior/int-cocina.webp";
export const INT_GARAJE_1 = "/media/interior/int-garaje-1.webp";
export const INT_GARAJE_2 = "/media/interior/int-garaje-2.webp";
export const INT_BANO_PRINCIPAL = "/media/interior/int-bano-principal.webp";
export const INT_LITERAS = "/media/interior/int-literas.webp";
export const INT_LAMPARAS = "/media/interior/int-lamparas.webp";
export const INT_CAFETERA = "/media/interior/int-cafetera.webp";
export const INT_DORMITORIO_2 = "/media/interior/int-dormitorio-2.webp";
export const INT_ASEO = "/media/interior/int-aseo.webp";
export const INT_SALON_1 = "/media/interior/int-salon-1.webp";
export const INT_SALON_2 = "/media/interior/int-salon-2.webp";

export const ALL_EXTERIOR = [
  { src: EXT_VISTA_GENERAL, alt: "Vista general exterior con piscina", category: "Exterior" },
  { src: EXT_PISCINA_BAR, alt: "Piscina con bar", category: "Exterior" },
  { src: EXT_CAMA_BALINESA, alt: "Zona de piscina con cama balinesa", category: "Exterior" },
  { src: EXT_PISCINA_LATERAL, alt: "Piscina vista lateral", category: "Exterior" },
  { src: EXT_CHOZO_BAMBU, alt: "Chozo de bambu africano", category: "Exterior" },
  { src: EXT_TUMBONAS, alt: "Zona de tumbonas", category: "Exterior" },
  { src: EXT_BARBACOA, alt: "Zona de barbacoa", category: "Exterior" },
  { src: EXT_JARDIN_DETALLE, alt: "Detalle del jardin", category: "Exterior" },
  { src: EXT_PANORAMICA, alt: "Vista panoramica de la villa", category: "Exterior" },
  { src: EXT_PISCINA_NOCHE, alt: "Piscina iluminada", category: "Exterior" },
  { src: EXT_DETALLE_1, alt: "Detalle exterior", category: "Exterior" },
  { src: EXT_ZONA_RELAX, alt: "Zona de relax", category: "Exterior" },
  { src: EXT_FACHADA, alt: "Fachada de la villa", category: "Exterior" },
  { src: EXT_JARDIN, alt: "Jardin", category: "Exterior" },
  { src: EXT_PISCINA_DETALLE, alt: "Detalle de la piscina", category: "Exterior" },
  { src: EXT_ZONA_2, alt: "Zona exterior", category: "Exterior" },
  { src: EXT_GENERAL_2, alt: "Vista general", category: "Exterior" },
  { src: EXT_DETALLE_2, alt: "Detalle exterior", category: "Exterior" },
  { src: EXT_ADICIONAL, alt: "Exterior adicional", category: "Exterior" },
];

export const ALL_INTERIOR = [
  { src: INT_DORMITORIO_PRINCIPAL, alt: "Dormitorio principal", category: "Interior" },
  { src: INT_COCINA, alt: "Cocina moderna equipada", category: "Interior" },
  { src: INT_GARAJE_1, alt: "Garaje privado", category: "Interior" },
  { src: INT_GARAJE_2, alt: "Garaje con puerta", category: "Interior" },
  { src: INT_BANO_PRINCIPAL, alt: "Bano principal", category: "Interior" },
  { src: INT_LITERAS, alt: "Habitacion con literas", category: "Interior" },
  { src: INT_LAMPARAS, alt: "Lamparas decorativas", category: "Interior" },
  { src: INT_CAFETERA, alt: "Detalle cocina con cafetera", category: "Interior" },
  { src: INT_DORMITORIO_2, alt: "Dormitorio con dos camas", category: "Interior" },
  { src: INT_ASEO, alt: "Aseo", category: "Interior" },
  { src: INT_SALON_1, alt: "Salon con sofa y TV", category: "Interior" },
  { src: INT_SALON_2, alt: "Salon-comedor", category: "Interior" },
];

// Video URLs
export const VIDEO_EXTERIOR = "/media/video/video-exterior.mp4";
export const VIDEO_INTERIOR = "/media/video/video-interior.mp4";
