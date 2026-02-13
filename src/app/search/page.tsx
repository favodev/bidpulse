"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  Gavel,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Navbar } from "@/components/layout";
import { Footer } from "@/components/layout";
import { Button } from "@/components/ui";
import { AuctionCard } from "@/components/auction";
import { getAuctions } from "@/services/auction.service";
import {
  Auction,
  AuctionCategory,
  AuctionStatus,
} from "@/types/auction.types";
import { useLanguage } from "@/i18n";

// Rangos de precio en CLP
const PRICE_RANGES = [
  { value: "all", min: 0, max: Infinity },
  { value: "0-10000", min: 0, max: 10000 },
  { value: "10000-50000", min: 10000, max: 50000 },
  { value: "50000-100000", min: 50000, max: 100000 },
  { value: "100000-500000", min: 100000, max: 500000 },
  { value: "500000+", min: 500000, max: Infinity },
];

const PRICE_RANGE_LABELS: Record<string, { es: string; en: string }> = {
  "all": { es: "Cualquier precio", en: "Any price" },
  "0-10000": { es: "Hasta $10.000", en: "Up to $10,000" },
  "10000-50000": { es: "$10.000 - $50.000", en: "$10,000 - $50,000" },
  "50000-100000": { es: "$50.000 - $100.000", en: "$50,000 - $100,000" },
  "100000-500000": { es: "$100.000 - $500.000", en: "$100,000 - $500,000" },
  "500000+": { es: "Más de $500.000", en: "Over $500,000" },
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") as AuctionCategory | null;

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de búsqueda y filtros 
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<AuctionCategory | "all">(
    initialCategory ? initialCategory : "all"
  );
  const [selectedStatus, setSelectedStatus] = useState<AuctionStatus | "all">("active");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("endTime-asc");
  
  // UI states
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    status: true,
    price: true,
  });

  // Cargar todas las subastas
  useEffect(() => {
    async function loadAuctions() {
      setLoading(true);
      try {
        const data = await getAuctions({
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          limit: 100,
        });
        setAuctions(data);
      } catch (err) {
        console.error("Error loading auctions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAuctions();
  }, [selectedStatus]);

  // Filtrar resultados
  const filteredAuctions = useMemo(() => {
    let results = auctions;

    // Filtrar por búsqueda de texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (auction) =>
          auction.title.toLowerCase().includes(query) ||
          auction.description?.toLowerCase().includes(query) ||
          t.categories[auction.category as keyof typeof t.categories]?.toLowerCase().includes(query)
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== "all") {
      results = results.filter((auction) => auction.category === selectedCategory);
    }

    // Filtrar por rango de precio
    if (priceRange !== "all") {
      const range = PRICE_RANGES.find((r) => r.value === priceRange);
      if (range) {
        results = results.filter(
          (auction) =>
            auction.currentBid >= range.min && auction.currentBid <= range.max
        );
      }
    }

    // Ordenar client-side
    const [sortField, sortOrder] = sortBy.split("-") as [string, "asc" | "desc"];
    results = [...results].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortField) {
        case "currentBid":
          aVal = a.currentBid ?? 0;
          bVal = b.currentBid ?? 0;
          break;
        case "bidsCount":
          aVal = a.bidsCount ?? 0;
          bVal = b.bidsCount ?? 0;
          break;
        case "createdAt":
          aVal = a.createdAt?.seconds ?? 0;
          bVal = b.createdAt?.seconds ?? 0;
          break;
        case "endTime":
        default:
          aVal = a.endTime?.seconds ?? 0;
          bVal = b.endTime?.seconds ?? 0;
          break;
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return results;
  }, [auctions, searchQuery, selectedCategory, priceRange, sortBy]);

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("active");
    setPriceRange("all");
    setSortBy("endTime-asc");
    router.push("/search");
  };

  // Contar filtros activos
  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedStatus !== "active",
    priceRange !== "all",
  ].filter(Boolean).length;

  // Toggle secciones de filtro
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Componente de filtros (reutilizable para desktop y mobile)
  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Categorías */}
      <div>
        <button
          onClick={() => toggleSection("category")}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            {t.search.category}
          </h3>
          {expandedSections.category ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        {expandedSections.category && (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === "all"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {t.search.allCategories}
            </button>
            {Object.keys(t.categories).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as AuctionCategory)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === key
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {t.categories[key as keyof typeof t.categories]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Estado */}
      <div>
        <button
          onClick={() => toggleSection("status")}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            {t.search.status}
          </h3>
          {expandedSections.status ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        {expandedSections.status && (
          <div className="space-y-1">
            {[
              { value: "all", label: t.search.allStatus },
              { value: "active", label: t.myAuctions.active },
              { value: "ended", label: t.myAuctions.ended },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value as AuctionStatus | "all")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedStatus === option.value
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rango de precio */}
      <div>
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            {t.search.priceRange}
          </h3>
          {expandedSections.price ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
        {expandedSections.price && (
          <div className="space-y-1">
            {PRICE_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setPriceRange(range.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  priceRange === range.value
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {PRICE_RANGE_LABELS[range.value][language]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Botón limpiar filtros */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          {t.search.clearFilters} ({activeFiltersCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20">
        {/* Header con búsqueda */}
        <div className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.search.placeholder}
                  className="w-full pl-12 pr-12 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Info de resultados */}
            <div className="max-w-2xl mx-auto mt-4 flex items-center justify-between">
              <p className="text-slate-400 text-sm">
                {loading ? (
                  t.common.loading
                ) : (
                  <>
                    <span className="text-white font-medium">{filteredAuctions.length}</span>
                    {" "}{t.search.results}
                    {searchQuery && (
                      <>
                        {" "}"<span className="text-emerald-400">{searchQuery}</span>"
                      </>
                    )}
                  </>
                )}
              </p>

              {/* Ordenar (desktop) */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-slate-500 text-sm">{t.search.sortBy}:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="endTime-asc">{t.search.endingSoon}</option>
                  <option value="endTime-desc">{t.search.endingLast}</option>
                  <option value="currentBid-asc">{t.search.priceLowHigh}</option>
                  <option value="currentBid-desc">{t.search.priceHighLow}</option>
                  <option value="bidsCount-desc">{t.search.mostPopular}</option>
                  <option value="createdAt-desc">{t.search.newest}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-8">
            {/* Sidebar de filtros (desktop) */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    {t.search.filters}
                  </h2>
                  {activeFiltersCount > 0 && (
                    <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                <FiltersContent />
              </div>
            </aside>

            {/* Contenido principal */}
            <div className="flex-1">
              {/* Botón filtros mobile */}
              <div className="lg:hidden mb-4 flex gap-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {t.search.filters}
                  {activeFiltersCount > 0 && (
                    <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Ordenar mobile */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="endTime-asc">{t.search.endingSoon}</option>
                  <option value="endTime-desc">{t.search.endingLast}</option>
                  <option value="currentBid-asc">{t.search.priceLowHigh}</option>
                  <option value="currentBid-desc">{t.search.priceHighLow}</option>
                  <option value="bidsCount-desc">{t.search.mostPopular}</option>
                  <option value="createdAt-desc">{t.search.newest}</option>
                </select>
              </div>

              {/* Tags de filtros activos */}
              {(searchQuery || activeFiltersCount > 0) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 text-white text-sm rounded-full">
                      "{searchQuery}"
                      <button
                        onClick={() => setSearchQuery("")}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedCategory !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 text-white text-sm rounded-full">
                      {t.categories[selectedCategory as keyof typeof t.categories]}
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {priceRange !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 text-white text-sm rounded-full">
                      {PRICE_RANGE_LABELS[priceRange][language]}
                      <button
                        onClick={() => setPriceRange("all")}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Resultados */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : filteredAuctions.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                  <Gavel className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {t.search.noResults}
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {searchQuery
                      ? `${t.search.noResults}: "${searchQuery}"`
                      : t.search.noResults}
                  </p>
                  <Button variant="outline" onClick={clearAllFilters}>
                    {t.search.clearFilters}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredAuctions.map((auction) => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal filtros mobile */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-white text-lg">{t.search.filters}</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FiltersContent />
            <div className="mt-6 pt-4 border-t border-slate-800">
              <Button
                className="w-full"
                onClick={() => setShowMobileFilters(false)}
              >
                {filteredAuctions.length} {t.search.results}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
