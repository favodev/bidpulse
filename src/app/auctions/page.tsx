"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  ChevronDown,
  Loader2,
  SlidersHorizontal,
  X,
  Gavel
} from "lucide-react";
import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui";
import { AuctionCard } from "@/components/auction";
import { getAuctions } from "@/services/auction.service";
import { Auction, AuctionCategory, AuctionStatus, CATEGORY_LABELS } from "@/types/auction.types";

// Opciones de ordenamiento
const SORT_OPTIONS = [
  { value: "endTime-asc", label: "Terminan pronto" },
  { value: "endTime-desc", label: "Terminan último" },
  { value: "currentBid-asc", label: "Precio: menor a mayor" },
  { value: "currentBid-desc", label: "Precio: mayor a menor" },
  { value: "bidsCount-desc", label: "Más populares" },
  { value: "createdAt-desc", label: "Más recientes" },
];

// Opciones de estado
const STATUS_OPTIONS: { value: AuctionStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Activas" },
  { value: "ended", label: "Finalizadas" },
  { value: "scheduled", label: "Próximamente" },
];

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AuctionCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<AuctionStatus | "all">("active");
  const [sortBy, setSortBy] = useState("endTime-asc");
  const [showFilters, setShowFilters] = useState(false);

  // Cargar subastas
  useEffect(() => {
    async function loadAuctions() {
      setLoading(true);
      setError("");

      try {
        const [sortField, sortOrder] = sortBy.split("-") as [string, "asc" | "desc"];
        
        const data = await getAuctions({
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          sortBy: sortField as "endTime" | "currentBid" | "bidsCount" | "createdAt",
          sortOrder,
          limit: 50,
        });

        setAuctions(data);
      } catch (err) {
        console.error(err);
        setError("Error al cargar las subastas");
      } finally {
        setLoading(false);
      }
    }

    loadAuctions();
  }, [selectedCategory, selectedStatus, sortBy]);

  // Filtrar por búsqueda (cliente)
  const filteredAuctions = useMemo(() => {
    if (!searchQuery.trim()) return auctions;
    
    const query = searchQuery.toLowerCase();
    return auctions.filter(
      (auction) =>
        auction.title.toLowerCase().includes(query) ||
        auction.description.toLowerCase().includes(query)
    );
  }, [auctions, searchQuery]);

  // Categorías disponibles (todas las del enum)
  const categories: { value: AuctionCategory | "all"; label: string }[] = [
    { value: "all", label: "Todas las categorías" },
    ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
      value: value as AuctionCategory,
      label,
    })),
  ];

  // Limpiar filtros
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("active");
    setSortBy("endTime-asc");
  };

  const hasActiveFilters = 
    searchQuery || 
    selectedCategory !== "all" || 
    selectedStatus !== "active" || 
    sortBy !== "endTime-asc";

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Subastas</h1>
            <p className="text-gray-400 mt-1">
              {filteredAuctions.length} subastas encontradas
            </p>
          </div>

          {/* Búsqueda */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar subastas..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-slate-900 rounded-xl p-4 mb-8">
          {/* Desktop Filters */}
          <div className="hidden md:flex items-center gap-4 flex-wrap">
            {/* Categoría */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as AuctionCategory | "all")}
                className="appearance-none bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Estado */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as AuctionStatus | "all")}
                className="appearance-none bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Ordenar */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Limpiar filtros */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Mobile Filters Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-white cursor-pointer"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filtros
              {hasActiveFilters && (
                <span className="bg-emerald-500 text-xs px-2 py-0.5 rounded-full">
                  Activos
                </span>
              )}
            </button>

            {/* Mobile Filters Panel */}
            {showFilters && (
              <div className="mt-4 space-y-4">
                {/* Categoría */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Categoría</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as AuctionCategory | "all")}
                    className="w-full appearance-none bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Estado</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as AuctionStatus | "all")}
                    className="w-full appearance-none bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ordenar */}
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Ordenar por</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Limpiar */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-8 text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        )}

        {/* Grid de subastas */}
        {!loading && filteredAuctions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAuctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}

        {/* Estado vacío */}
        {!loading && filteredAuctions.length === 0 && (
          <div className="text-center py-20">
            <Gavel className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No se encontraron subastas
            </h3>
            <p className="text-gray-400 mb-6">
              Intenta ajustar los filtros o busca algo diferente
            </p>
            <Button onClick={clearFilters}>Limpiar filtros</Button>
          </div>
        )}
      </main>
    </div>
  );
}
