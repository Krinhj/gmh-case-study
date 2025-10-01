import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { TryOutSection } from "@/components/landing/try-out-section";
import { FeatureCards } from "@/components/landing/feature-cards";
import { CTASection } from "@/components/landing/cta-section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <TryOutSection />
        <FeatureCards />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
