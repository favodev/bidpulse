"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

const trendingTags = [
  "Vintage Rolex",
  "Banksy Art",
  "Classic Cars",
  "Electrónica",
];

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleTagClick = (tag: string) => {
    router.push(`/search?q=${encodeURIComponent(tag)}`);
  };

  return (
    <section className="relative min-h-150 flex items-center justify-center overflow-hidden">
      {/* Fondo con gradiente y efecto */}
      <div className="absolute inset-0 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Efecto de líneas decorativas */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-0 w-full h-px bg-linear-to-r from-transparent via-emerald-500 to-transparent" />
          <div className="absolute top-1/3 left-0 w-full h-px bg-linear-to-r from-transparent via-emerald-400/50 to-transparent" />
          <div className="absolute top-1/2 left-0 w-full h-px bg-linear-to-r from-transparent via-emerald-600/30 to-transparent" />
        </div>
        {/* Efecto de brillo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Contenido */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Título principal */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
          Experimenta la Emoción de la
          <span className="block text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-emerald-600 mt-2">
            Puja en Vivo
          </span>
        </h1>

        {/* Descripción */}
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Únete al marketplace de artículos únicos con mayor crecimiento.
          <br className="hidden sm:block" />
          Asegura tu legado con subastas en tiempo real.
        </p>

        {/* Barra de búsqueda */}
        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mb-6">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar relojes, arte, electrónica..."
              className="w-full pl-12 pr-28 py-4 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Tags de tendencia */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-slate-500 text-sm">Tendencia:</span>
          {trendingTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="px-3 py-1 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
