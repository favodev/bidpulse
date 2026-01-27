import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/home/HeroSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Barra de navegación */}
      <Navbar />
      <div className="pt-16">
        {/* Sección principal con buscador */}
        <HeroSection />
      </div>
    </div>
  );
}
