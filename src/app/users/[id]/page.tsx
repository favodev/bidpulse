"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/i18n";
import { Navbar, Footer } from "@/components/layout";
import { Button, ReportUserModal } from "@/components/ui";
import { AuctionCard } from "@/components/auction";
import { StarRating } from "@/components/ui/StarRating";
import {
  Calendar,
  ShieldCheck,
  ShoppingBag,
  Award,
  Loader2,
  UserX,
} from "lucide-react";
import { getUserProfile } from "@/services/user.service";
import { getAuctions } from "@/services/auction.service";
import { getSellerRatingSummary } from "@/services/review.service";
import { SellerRatingSummaryCard } from "@/components/review/SellerRatingSummary";
import { UserProfile } from "@/types/user.types";
import { Auction } from "@/types/auction.types";
import { useAuth } from "@/hooks/useAuth";
import { createUserReport } from "@/services/report.service";
import type { ReportReason } from "@/types/report.types";

// Página de Perfil Público de Usuario
export default function UserProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [ratingSummary, setRatingSummary] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reporting, setReporting] = useState(false);

  // Cargar datos del usuario y sus subastas
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function loadUserData() {
      try {
        setLoading(true);

        // Cargar perfil del usuario
        const profile = await getUserProfile(id);
        setUserProfile(profile);

        // Cargar subastas activas del usuario
        if (profile) {
          const userAuctions = await getAuctions({
            sellerId: id,
            status: "active",
            limit: 12,
          });
          setAuctions(userAuctions);
          // Cargar resumen de valoraciones
          try {
            const summary = await getSellerRatingSummary(id);
            setRatingSummary(summary);
          } catch (err) {
            console.warn("Error cargando resumen de valoraciones:", err);
          }
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [id]);

  // Formatear fecha de registro
  const formatJoinDate = (timestamp: { toDate: () => Date } | undefined) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const handleReportUser = async (data: { reason: ReportReason; details: string }) => {
    if (!user || !userProfile) return;
    setReporting(true);
    try {
      await createUserReport({
        reporterId: user.uid,
        reportedUserId: userProfile.id,
        reason: data.reason,
        details: data.details,
      });
      setShowReportModal(false);
    } catch (error) {
      console.error("Error reporting user:", error);
    } finally {
      setReporting(false);
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
        <Footer />
      </>
    );
  }

  // Usuario no encontrado
  if (!userProfile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
          <div className="max-w-2xl mx-auto text-center py-20">
            <UserX size={64} className="mx-auto text-slate-600 mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">
              {t.publicProfile.notFound}
            </h1>
            <p className="text-slate-400 mb-6">
              {t.publicProfile.notFoundDesc}
            </p>
            <Link href="/">
              <Button variant="outline">{t.common.backToHome}</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Cabecera del Perfil */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              {/* Avatar con badge de verificación */}
              <div>
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-800 relative">
                  {userProfile.avatar ? (
                    <Image
                      src={userProfile.avatar}
                      alt={userProfile.displayName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-4xl font-bold">
                      {(userProfile.displayName && userProfile.displayName.charAt(0).toUpperCase()) || "?"}
                    </div>
                  )}

                  {userProfile.isVerified && (
                    <div
                      className="absolute bottom-1 right-1 bg-blue-500 text-white p-1.5 rounded-full border-2 border-slate-900"
                      title={t.publicProfile.verified}
                    >
                      <ShieldCheck size={16} />
                    </div>
                  )}
                </div>
              </div>

            {/* Información del usuario */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">
                    {userProfile.displayName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {t.publicProfile.joined} {formatJoinDate(userProfile.createdAt as unknown as { toDate: () => Date })}
                    </span>
                    {ratingSummary ? (
                      <div className="flex items-center gap-3">
                        <SellerRatingSummaryCard summary={ratingSummary} compact />
                      </div>
                    ) : userProfile.stats.reviewsCount > 0 ? (
                      <span className="flex items-center gap-1.5 text-yellow-500 font-medium">
                        <StarRating rating={userProfile.stats.rating} size="sm" />
                        <span className="text-slate-400">
                          ({userProfile.stats.reviewsCount} {t.publicProfile.reviews})
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  {user && user.uid !== userProfile.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowReportModal(true)}
                    >
                      {t.publicProfile.report || "Reportar usuario"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Biografía */}
              {userProfile.bio && (
                <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
                  {userProfile.bio}
                </p>
              )}

              {/* Estadísticas */}
              <div className="flex gap-4 pt-2">
                <div className="px-4 py-2 bg-slate-800/50 rounded-lg text-center min-w-20">
                  <span className="block text-lg font-bold text-white">
                    {userProfile.stats.auctionsCreated}
                  </span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">
                    {t.publicProfile.stats.sold}
                  </span>
                </div>
                <div className="px-4 py-2 bg-slate-800/50 rounded-lg text-center min-w-20">
                  <span className="block text-lg font-bold text-white">
                    {userProfile.stats.auctionsWon}
                  </span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">
                    {t.publicProfile.stats.bought}
                  </span>
                </div>
                {userProfile.stats.rating > 0 && (
                  <div className="px-4 py-2 bg-slate-800/50 rounded-lg text-center min-w-20">
                    <span className="block text-lg font-bold text-white">
                      {userProfile.stats.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">
                      {t.publicProfile.stats.rating}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas de navegación */}
        <div className="flex items-center border-b border-slate-800 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("listings")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "listings"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <ShoppingBag size={16} />
            {t.publicProfile.activeListings} ({auctions.length})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === "reviews"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <Award size={16} />
            {t.publicProfile.reviews}
          </button>
        </div>

        {/* Contenido según pestaña activa */}
        {activeTab === "listings" ? (
          auctions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {auctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
              <ShoppingBag size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">{t.publicProfile.noListings}</p>
            </div>
          )
        ) : (
          <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
            <Award size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 mb-4">{t.publicProfile.reviewsPlaceholder}</p>
            <Link
              href={`/reviews/seller/${id}`}
              className="text-blue-400 hover:underline"
            >
              {t.publicProfile.viewAllReviews}
            </Link>
          </div>
        )}
        </div>
      </main>
    <Footer />

      <ReportUserModal
        isOpen={showReportModal}
        userName={userProfile.displayName}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportUser}
        isSubmitting={reporting}
      />
    </>
  );
}
