import { Navbar, Footer } from "@/components/layout";
import {
  HeroSection,
  EndingSoonSection,
  PopularAuctionsSection,
  CategoriesSection,
} from "@/components/home";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Contenido principal */}
      <main className="flex-1 pt-16">
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
