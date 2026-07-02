import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, MessageCircle } from "lucide-react";

const POPUP_DELAY_MS = 5_000; // 5 seconds

export default function OfferPopup() {
  const [visible, setVisible] = useState(false);

  const { data } = trpc.offers.getActive.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const offer = data?.offer;

  useEffect(() => {
    if (!offer) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, [offer]);

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible || !offer) return null;

  const hasImage = !!offer.imageUrl;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Popup — sized to fit 600x600 image */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 w-full ${
          hasImage ? "max-w-[900px]" : "max-w-md"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors z-10 shadow-sm"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Layout: horizontal on desktop, stacked on mobile */}
        <div className={hasImage ? "flex flex-col sm:flex-row" : ""}>
          {/* Left: text content */}
          <div className={`p-6 ${hasImage ? "sm:flex-1 flex flex-col justify-center" : ""}`}>
            {/* Top accent bar (only if no image) */}
            {!hasImage && (
              <div className="h-1.5 bg-gradient-to-r from-[oklch(0.72_0.15_60)] to-[oklch(0.65_0.18_40)] -mx-6 -mt-6 mb-5 rounded-t-2xl" />
            )}


            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {offer.title}
            </h3>

            {/* Discount badge */}
            {offer.discount && (
              <div className="inline-block mb-3 px-4 py-1.5 bg-gradient-to-r from-[oklch(0.72_0.15_60)] to-[oklch(0.65_0.18_40)] text-white text-sm font-bold rounded-lg">
                {offer.discount}
              </div>
            )}

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed mb-5">
              {offer.description}
            </p>

            {/* CTA buttons */}
            <div className="flex gap-3">
              <a
                href="https://wa.me/34644478741?text=Hola%2C%20me%20interesa%20la%20oferta%20de%20Villa%20Campito"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Reservar por WhatsApp
              </a>
              <button
                onClick={handleClose}
                className="px-4 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>

          {/* Right: image 600x600 */}
          {hasImage && (
            <div className="order-first sm:order-last shrink-0 bg-gray-50">
              <img
                src={offer.imageUrl!}
                alt={offer.title}
                className="w-full h-64 sm:w-[300px] sm:h-[300px] object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
