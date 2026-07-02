/*
 * Home — Villa Campito
 * Main landing page composing all sections.
 * Design: "Sal y Sol" — Coastal Minimalism
 */

import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";
import GallerySection from "@/components/GallerySection";
import VideoSection from "@/components/VideoSection";
import RulesSection from "@/components/RulesSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import OfferPopup from "@/components/OfferPopup";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <GallerySection />
        <VideoSection />
        <RulesSection />
        <ContactSection />
      </main>
      <Footer />
      <WhatsAppFloat />
      <OfferPopup />
    </div>
  );
}
