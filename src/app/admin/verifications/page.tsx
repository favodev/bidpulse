"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  Star,
  Package,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Button, Alert, ConfirmModal } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";
import {
  getAllVerificationRequests,
  approveVerification,
  rejectVerification,
} from "@/services/verification.service";
import type { VerificationRequest, VerificationStatus } from "@/types/user.types";

export default function AdminVerificationsPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<VerificationStatus | "all">("pending");
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  async function loadRequests() {
    setLoading(true);
    try {
      const status = filter === "all" ? undefined : filter;
      const data = await getAllVerificationRequests(status);
      setRequests(data);
    } catch (err) {
      console.error("Error loading verification requests:", err);
      setError("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(requestId: string) {
    setProcessing(true);
    try {
      const result = await approveVerification(requestId);
      if (result) {
        setSuccess("Solicitud aprobada correctamente");
        await loadRequests();
      } else {
        setError("Error al aprobar la solicitud");
      }
    } catch {
      setError("Error al aprobar la solicitud");
    } finally {
      setProcessing(false);
      setActionId(null);
      setActionType(null);
    }
  }

  async function handleReject(requestId: string) {
    if (!rejectionReason.trim()) {
      setError("Debes proporcionar una razón de rechazo");
      return;
    }
    setProcessing(true);
    try {
      const result = await rejectVerification(requestId, rejectionReason);
      if (result) {
        setSuccess("Solicitud rechazada");
        setRejectionReason("");
        await loadRequests();
      } else {
        setError("Error al rechazar la solicitud");
      }
    } catch {
      setError("Error al rechazar la solicitud");
    } finally {
      setProcessing(false);
      setActionId(null);
      setActionType(null);
    }
  }

  function getStatusBadge(status: VerificationStatus) {
    const config = {
      pending: { icon: Clock, color: "text-yellow-400 bg-yellow-400/10", label: "Pendiente" },
      approved: { icon: CheckCircle, color: "text-green-400 bg-green-400/10", label: "Aprobada" },
      rejected: { icon: XCircle, color: "text-red-400 bg-red-400/10", label: "Rechazada" },
      none: { icon: Clock, color: "text-slate-400 bg-slate-400/10", label: "Sin estado" },
    };
    const { icon: Icon, color, label } = config[status] || config.none;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        {label}
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

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Verificaciones de Vendedor</h1>
            <p className="text-slate-400 text-sm">Gestiona las solicitudes de verificación</p>
          </div>
        </div>

        {/* Alerts */}
        {error && <Alert variant="error" message={error} onClose={() => setError("")} className="mb-4" />}
        {success && <Alert variant="success" message={success} onClose={() => setSuccess("")} className="mb-4" />}

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : f === "approved" ? "Aprobadas" : "Rechazadas"}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay solicitudes {filter !== "all" ? `con estado "${filter}"` : ""}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-full">
                      <User className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{req.userName}</h3>
                      <p className="text-slate-400 text-sm flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {req.userEmail}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(req.status)}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <Package className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-white font-semibold">{req.auctionsCreated}</p>
                    <p className="text-slate-400 text-xs">Subastas</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                    <p className="text-white font-semibold">{req.rating.toFixed(1)}</p>
                    <p className="text-slate-400 text-xs">Rating ({req.reviewsCount})</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <Calendar className="w-4 h-4 text-green-400 mx-auto mb-1" />
                    <p className="text-white font-semibold text-sm">{formatDate(req.createdAt)}</p>
                    <p className="text-slate-400 text-xs">Fecha</p>
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-slate-800/30 rounded-lg p-3 mb-4">
                  <p className="text-slate-300 text-sm font-medium mb-1">Motivo de solicitud:</p>
                  <p className="text-slate-400 text-sm">{req.reason}</p>
                </div>

                {/* Rejection reason if rejected */}
                {req.status === "rejected" && req.rejectionReason && (
                  <div className="bg-red-900/20 rounded-lg p-3 mb-4">
                    <p className="text-red-300 text-sm font-medium mb-1">Razón de rechazo:</p>
                    <p className="text-red-400 text-sm">{req.rejectionReason}</p>
                  </div>
                )}

                {/* Actions for pending */}
                {req.status === "pending" && (
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => { setActionId(req.id); setActionType("approve"); }}
                      disabled={processing}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setActionId(req.id); setActionType("reject"); }}
                      disabled={processing}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Approve Confirm */}
        {actionType === "approve" && actionId && (
          <ConfirmModal
            isOpen={true}
            title="Aprobar verificación"
            message="¿Estás seguro de aprobar esta solicitud de verificación? El usuario obtendrá el badge de vendedor verificado."
            confirmLabel="Aprobar"
            onConfirm={() => handleApprove(actionId)}
            onCancel={() => { setActionId(null); setActionType(null); }}
          />
        )}

        {/* Reject Confirm with reason */}
        {actionType === "reject" && actionId && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-white font-semibold text-lg mb-2">Rechazar verificación</h3>
              <p className="text-slate-400 text-sm mb-4">Proporciona una razón para el rechazo:</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ minHeight: 100 }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Razón del rechazo..."
              />
              <div className="flex gap-3 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setActionId(null); setActionType(null); setRejectionReason(""); }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleReject(actionId)}
                  isLoading={processing}
                >
                  Confirmar rechazo
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
