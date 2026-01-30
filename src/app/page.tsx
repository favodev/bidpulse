import { Navbar, Footer } from "@/components/layout";
import {
  HeroSection,
  EndingSoonSection,
  PopularAuctionsSection,
  CategoriesSection,
} from "@/components/home";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <Navbar />

      {/* Contenido principal */}
      <main className="pt-16">
        <HeroSection />
        <EndingSoonSection />
        <PopularAuctionsSection />
        <CategoriesSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
