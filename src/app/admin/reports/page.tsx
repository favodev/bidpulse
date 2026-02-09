"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Flag,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle,
  User,
  Package,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Button, Alert } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";
import {
  getUserReports,
  getAuctionReports,
  updateReportStatus,
} from "@/services/report.service";
import type { UserReport, AuctionReport, ReportReason } from "@/types/report.types";

const REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam",
  fraud: "Fraude",
  harassment: "Acoso",
  fake_listing: "Publicación falsa",
  inappropriate_content: "Contenido inapropiado",
  counterfeit: "Producto falsificado",
  misleading_description: "Descripción engañosa",
  other: "Otro",
};

type ReportTab = "users" | "auctions";
type StatusFilter = "all" | "pending" | "reviewing" | "resolved";

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [tab, setTab] = useState<ReportTab>("users");
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [auctionReports, setAuctionReports] = useState<AuctionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    loadReports();
  }, [tab, filter]);

  async function loadReports() {
    setLoading(true);
    try {
      const statusFilter = filter === "all" ? undefined : filter;
      if (tab === "users") {
        const data = await getUserReports(statusFilter as "pending" | "reviewing" | "resolved" | undefined);
        setUserReports(data);
      } else {
        const data = await getAuctionReports(statusFilter as "pending" | "reviewing" | "resolved" | undefined);
        setAuctionReports(data);
      }
    } catch (err) {
      console.error("Error loading reports:", err);
      setError("Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(
    reportId: string,
    type: "user" | "auction",
    newStatus: "reviewing" | "resolved"
  ) {
    setProcessing(reportId);
    try {
      await updateReportStatus(reportId, type, newStatus);
      setSuccess(`Reporte marcado como "${newStatus === "reviewing" ? "En revisión" : "Resuelto"}"`);
      await loadReports();
    } catch {
      setError("Error al actualizar el reporte");
    } finally {
      setProcessing(null);
    }
  }

  function getStatusBadge(status: string) {
    const config: Record<string, { icon: typeof Clock; color: string; label: string }> = {
      pending: { icon: Clock, color: "text-yellow-400 bg-yellow-400/10", label: "Pendiente" },
      reviewing: { icon: Eye, color: "text-blue-400 bg-blue-400/10", label: "En revisión" },
      resolved: { icon: CheckCircle, color: "text-green-400 bg-green-400/10", label: "Resuelto" },
    };
    const cfg = config[status] || config.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {cfg.label}
      </span>
    );
  }

  function formatDate(timestamp: { toMillis?: () => number } | undefined) {
    if (!timestamp?.toMillis) return "—";
    return new Date(timestamp.toMillis()).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const reports = tab === "users" ? userReports : auctionReports;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <Flag className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reportes</h1>
            <p className="text-slate-400 text-sm">Gestiona los reportes de usuarios y subastas</p>
          </div>
        </div>

        {/* Alerts */}
        {error && <Alert variant="error" message={error} onClose={() => setError("")} className="mb-4" />}
        {success && <Alert variant="success" message={success} onClose={() => setSuccess("")} className="mb-4" />}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === "users" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <User className="w-4 h-4" />
            Reportes de Usuarios
          </button>
          <button
            onClick={() => setTab("auctions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === "auctions" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Package className="w-4 h-4" />
            Reportes de Subastas
          </button>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 mb-6">
          {(["all", "pending", "reviewing", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === f ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {f === "all" ? "Todos" : f === "pending" ? "Pendientes" : f === "reviewing" ? "En revisión" : "Resueltos"}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
            <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay reportes {filter !== "all" ? `con estado "${filter}"` : ""}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const isUserReport = "reportedUserId" in report;
              return (
                <div key={report.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                      <span className="px-2 py-0.5 bg-orange-400/10 text-orange-400 rounded-full text-xs font-medium">
                        {REASON_LABELS[report.reason] || report.reason}
                      </span>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-slate-400">Reportado por:</p>
                      <p className="text-white font-medium">{report.reporterId}</p>
                    </div>
                    {isUserReport ? (
                      <div>
                        <p className="text-slate-400">Usuario reportado:</p>
                        <p className="text-white font-medium">{(report as UserReport).reportedUserId}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-slate-400">Subasta:</p>
                        <p className="text-white font-medium">{(report as AuctionReport).auctionTitle}</p>
                      </div>
                    )}
                  </div>

                  {report.details && (
                    <div className="bg-slate-800/30 rounded-lg p-3 mb-3">
                      <p className="text-slate-300 text-sm">{report.details}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-xs">{formatDate(report.createdAt)}</p>

                    {report.status !== "resolved" && (
                      <div className="flex gap-2">
                        {report.status === "pending" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              handleStatusChange(report.id, isUserReport ? "user" : "auction", "reviewing")
                            }
                            isLoading={processing === report.id}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            En revisión
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() =>
                            handleStatusChange(report.id, isUserReport ? "user" : "auction", "resolved")
                          }
                          isLoading={processing === report.id}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Resolver
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
