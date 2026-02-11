"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  DollarSign,
  TrendingUp,
  Gavel,
  Users,
  Eye,
  Trophy,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Clock,
  Star,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/i18n";
import { getAuctions } from "@/services/auction.service";
import { getAuctionBids } from "@/services/bid.service";
import { getUserProfile } from "@/services/user.service";
import { Auction } from "@/types/auction.types";
import { Bid } from "@/types/bid.types";
import { UserProfile } from "@/types/user.types";

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  gradient: string;
}

function StatCard({ icon, label, value, subValue, trend, gradient }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg ${gradient} flex items-center justify-center`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${
              trend >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {subValue && <p className="text-xs text-slate-600 mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [allBids, setAllBids] = useState<Bid[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [auctionsData, profileData] = await Promise.all([
          getAuctions({ sellerId: user.uid, sortBy: "createdAt", sortOrder: "desc" }),
          getUserProfile(user.uid),
        ]);

        setAuctions(auctionsData);
        setProfile(profileData);

        // Load bids for all auctions
        const bidsPromises = auctionsData.slice(0, 20).map((a) => getAuctionBids(a.id, 100));
        const bidsArrays = await Promise.all(bidsPromises);
        setAllBids(bidsArrays.flat());
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadData();
  }, [user]);

  // Computed stats
  const stats = useMemo(() => {
    const active = auctions.filter((a) => a.status === "active");
    const ended = auctions.filter((a) => a.status === "ended");
    const totalRevenue = ended.reduce((sum, a) => sum + (a.finalPrice || a.currentBid || 0), 0);
    const avgPrice = ended.length > 0 ? totalRevenue / ended.length : 0;
    const totalBids = auctions.reduce((sum, a) => sum + a.bidsCount, 0);
    const totalWatchers = auctions.reduce((sum, a) => sum + (a.watchersCount || 0), 0);
    const withBids = auctions.filter((a) => a.bidsCount > 0).length;
    const conversionRate = auctions.length > 0 ? (withBids / auctions.length) * 100 : 0;
    const auctionsWithWinner = ended.filter((a) => a.winnerId).length;
    const successRate = ended.length > 0 ? (auctionsWithWinner / ended.length) * 100 : 0;

    return {
      totalAuctions: auctions.length,
      activeAuctions: active.length,
      endedAuctions: ended.length,
      totalRevenue,
      avgPrice,
      totalBids,
      totalWatchers,
      conversionRate,
      successRate,
    };
  }, [auctions]);

  // Revenue over time chart data
  const revenueChartData = useMemo(() => {
    const ended = auctions
      .filter((a) => a.status === "ended" && a.endTime)
      .sort((a, b) => a.endTime.toMillis() - b.endTime.toMillis());

    const monthlyData: Record<string, { month: string; revenue: number; count: number }> = {};

    ended.forEach((a) => {
      const date = a.endTime.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
        month: "short",
        year: "2-digit",
      }).format(date);

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthLabel, revenue: 0, count: 0 };
      }
      monthlyData[monthKey].revenue += a.finalPrice || a.currentBid || 0;
      monthlyData[monthKey].count += 1;
    });

    return Object.values(monthlyData);
  }, [auctions, language]);

  // Bids activity chart (last 7 days)
  const bidsActivityData = useMemo(() => {
    const now = Date.now();
    const days: { day: string; bids: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = now - i * 86400000;
      const dayEnd = dayStart + 86400000;
      const dayLabel = new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
        weekday: "short",
        day: "numeric",
      }).format(new Date(dayStart));

      const count = allBids.filter((b) => {
        if (!b.createdAt) return false;
        const t = b.createdAt.toMillis();
        return t >= dayStart && t < dayEnd;
      }).length;

      days.push({ day: dayLabel, bids: count });
    }

    return days;
  }, [allBids, language]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    auctions.forEach((a) => {
      const cat = a.category || "other";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name: t.categories?.[name as keyof typeof t.categories] || name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [auctions, t]);

  // Top auctions
  const topAuctions = useMemo(() => {
    return [...auctions]
      .sort((a, b) => b.bidsCount - a.bidsCount)
      .slice(0, 5);
  }, [auctions]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          <p className="text-emerald-400">{formatPrice(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const BidsTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label}</p>
          <p className="text-blue-400">{payload[0].value} {t.auction?.bids || "pujas"}</p>
        </div>
      );
    }
    return null;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                {t.analytics?.title || "Dashboard de Vendedor"}
              </h1>
            </div>
            <p className="text-slate-500 ml-13">
              {t.analytics?.subtitle || "Resumen de rendimiento de tus subastas"}
            </p>
          </div>
          <Link href="/my-auctions">
            <Button variant="outline" size="sm">
              {t.myAuctions?.title || "Mis Subastas"}
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
            label={t.analytics?.totalRevenue || "Ingresos totales"}
            value={formatPrice(stats.totalRevenue)}
            gradient="bg-emerald-500/20"
          />
          <StatCard
            icon={<Gavel className="w-5 h-5 text-blue-400" />}
            label={t.analytics?.totalAuctions || "Total subastas"}
            value={String(stats.totalAuctions)}
            subValue={`${stats.activeAuctions} ${t.analytics?.active || "activas"}`}
            gradient="bg-blue-500/20"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
            label={t.analytics?.totalBids || "Total pujas"}
            value={String(stats.totalBids)}
            subValue={`Ø ${stats.totalAuctions > 0 ? (stats.totalBids / stats.totalAuctions).toFixed(1) : 0} / ${t.analytics?.perAuction || "por subasta"}`}
            gradient="bg-amber-500/20"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5 text-purple-400" />}
            label={t.analytics?.successRate || "Tasa de éxito"}
            value={`${stats.successRate.toFixed(0)}%`}
            subValue={`${stats.conversionRate.toFixed(0)}% ${t.analytics?.withBids || "con pujas"}`}
            gradient="bg-purple-500/20"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-teal-400" />}
            label={t.analytics?.avgPrice || "Precio promedio"}
            value={formatPrice(stats.avgPrice)}
            gradient="bg-teal-500/20"
          />
          <StatCard
            icon={<Eye className="w-5 h-5 text-sky-400" />}
            label={t.analytics?.watchers || "Observadores"}
            value={String(stats.totalWatchers)}
            gradient="bg-sky-500/20"
          />
          <StatCard
            icon={<Package className="w-5 h-5 text-orange-400" />}
            label={t.analytics?.endedAuctions || "Finalizadas"}
            value={String(stats.endedAuctions)}
            gradient="bg-orange-500/20"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-yellow-400" />}
            label={t.analytics?.rating || "Valoración"}
            value={profile?.stats?.rating?.toFixed(1) || "0.0"}
            subValue={`${profile?.stats?.reviewsCount || 0} ${t.reviews?.reviews || "reseñas"}`}
            gradient="bg-yellow-500/20"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              {t.analytics?.revenueOverTime || "Ingresos por mes"}
            </h2>
            {revenueChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => formatPrice(v)} stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} width={75} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                {t.analytics?.noData || "No hay datos suficientes"}
              </div>
            )}
          </div>

          {/* Bids Activity Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              {t.analytics?.bidsActivity || "Actividad de pujas (7 días)"}
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bidsActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip content={<BidsTooltip />} />
                  <Bar dataKey="bids" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {t.analytics?.categoryDistribution || "Distribución por categoría"}
            </h2>
            {categoryData.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.[0]) {
                            return (
                              <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-xl">
                                <p className="text-white text-sm">{payload[0].name}: {payload[0].value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {categoryData.map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-slate-300 truncate max-w-[150px]">{cat.name}</span>
                      </div>
                      <span className="text-slate-500">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500">
                {t.analytics?.noData || "No hay datos"}
              </div>
            )}
          </div>

          {/* Top Auctions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              {t.analytics?.topAuctions || "Subastas más populares"}
            </h2>
            {topAuctions.length > 0 ? (
              <div className="space-y-3">
                {topAuctions.map((auction, i) => (
                  <Link
                    key={auction.id}
                    href={`/auction/${auction.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-800 transition-colors group"
                  >
                    <span className="text-lg font-bold text-slate-600 w-6 text-center">
                      {i + 1}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                      {auction.images?.[0] ? (
                        <img
                          src={auction.images[0]}
                          alt={auction.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gavel className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                        {auction.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{auction.bidsCount} {t.auction?.bids || "pujas"}</span>
                        <span>{formatPrice(auction.currentBid)}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full ${
                            auction.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {auction.status === "active"
                            ? (t.auction?.active || "Activa")
                            : (t.auction?.ended || "Finalizada")}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500">
                {t.analytics?.noAuctions || "No hay subastas aún"}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
