"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Heart, Gavel, Trash2 } from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { AuctionCard } from "@/components/auction";
import { useAuth } from "@/hooks/useAuth";
import { getUserFavoriteIds, removeFromFavorites } from "@/services/favorite.service";
import { getAuction } from "@/services/auction.service";
import { Auction } from "@/types/auction.types";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadFavorites() {
      if (!user) return;

      setLoading(true);
      try {
        const favoriteIds = await getUserFavoriteIds(user.uid);
        
        // Cargar cada subasta
        const auctionPromises = favoriteIds.map((id) => getAuction(id));
        const auctions = await Promise.all(auctionPromises);
        
        // Filtrar nulls (subastas eliminadas)
        setFavorites(auctions.filter((a): a is Auction => a !== null));
      } catch (err) {
        console.error("Error loading favorites:", err);
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, [user]);

  const handleRemoveFavorite = async (auctionId: string) => {
    if (!user) return;
    
    setRemovingId(auctionId);
    try {
      await removeFromFavorites(user.uid, auctionId);
      setFavorites((prev) => prev.filter((a) => a.id !== auctionId));
    } catch (err) {
      console.error("Error removing favorite:", err);
    } finally {
      setRemovingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white">Mis Favoritos</h1>
          </div>
          <p className="text-slate-400">
            Subastas que has guardado para ver más tarde
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <Heart className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No tienes favoritos
            </h3>
            <p className="text-slate-500 mb-6">
              Guarda subastas que te interesen haciendo clic en el corazón
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              <Gavel className="w-5 h-5" />
              Explorar Subastas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((auction) => (
              <div key={auction.id} className="relative group">
                <AuctionCard auction={auction} />
                
                {/* Botón de eliminar */}
                <button
                  onClick={() => handleRemoveFavorite(auction.id)}
                  disabled={removingId === auction.id}
                  className="absolute top-3 right-3 p-2 bg-slate-900/90 hover:bg-red-500 text-slate-400 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  {removingId === auction.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
