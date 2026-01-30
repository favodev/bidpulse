"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Navbar } from "@/components/layout";
import { Input, Button, Alert } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { createAuction } from "@/services/auction.service";
import { AuctionCategory, CATEGORY_LABELS } from "@/types/auction.types";

export default function CreateAuctionPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other" as AuctionCategory,
    startingPrice: "",
    reservePrice: "",
    bidIncrement: "1",
    duration: "7",
    images: [] as string[],
  });

  // Imágenes de ejemplo para pruebas
  const sampleImages = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSampleImage = (url: string) => {
    if (!formData.images.includes(url)) {
      setFormData({ ...formData, images: [...formData.images, url] });
    }
  };

  const removeImage = (url: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter((img) => img !== url),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      setError("Debes iniciar sesión para crear una subasta");
      return;
    }

    if (!formData.title || !formData.startingPrice) {
      setError("Completa los campos obligatorios");
      return;
    }

    setLoading(true);

    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + parseInt(formData.duration) * 24 * 60 * 60 * 1000);

      const auctionId = await createAuction(
        {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          images: formData.images.length > 0 ? formData.images : sampleImages.slice(0, 1),
          startingPrice: parseFloat(formData.startingPrice),
          reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : undefined,
          bidIncrement: parseFloat(formData.bidIncrement),
          startTime: now,
          endTime: endDate,
        },
        user.uid,
        user.displayName || "Vendedor"
      );

      setSuccess("¡Subasta creada exitosamente!");
      
      setTimeout(() => {
        router.push(`/auction/${auctionId}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Error al crear la subasta. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <p className="text-gray-400 text-lg">Debes iniciar sesión para crear una subasta</p>
          <Button onClick={() => router.push("/login")}>Iniciar sesión</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">
          Crear nueva subasta
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert variant="error" message={error} />}
          {success && <Alert variant="success" message={success} />}

          {/* Título */}
          <Input
            label="Título del artículo *"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ej: Rolex Submariner 2024"
          />

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe tu artículo en detalle..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Categoría
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Precio inicial *"
              name="startingPrice"
              type="number"
              step="0.01"
              min="1"
              value={formData.startingPrice}
              onChange={handleChange}
              placeholder="100.00"
            />
            <Input
              label="Precio reserva (opcional)"
              name="reservePrice"
              type="number"
              step="0.01"
              min="1"
              value={formData.reservePrice}
              onChange={handleChange}
              placeholder="500.00"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Incremento mínimo"
              name="bidIncrement"
              type="number"
              step="0.01"
              min="1"
              value={formData.bidIncrement}
              onChange={handleChange}
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duración
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="1">1 día</option>
                <option value="3">3 días</option>
                <option value="5">5 días</option>
                <option value="7">7 días</option>
                <option value="14">14 días</option>
              </select>
            </div>
          </div>

          {/* Imágenes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Imágenes
            </label>

            {/* Imágenes seleccionadas */}
            {formData.images.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {formData.images.map((img) => (
                  <div key={img} className="relative w-20 h-20 rounded-lg overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Imágenes de ejemplo */}
            <p className="text-gray-500 text-sm mb-2">
              Selecciona imágenes de ejemplo:
            </p>
            <div className="flex gap-2 flex-wrap">
              {sampleImages.map((img) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => addSampleImage(img)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    formData.images.includes(img)
                      ? "border-emerald-500"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Botón submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Crear subasta"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
