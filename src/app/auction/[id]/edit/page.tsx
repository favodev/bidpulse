"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ImagePlus, Loader2, X, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout";
import { Footer } from "@/components/layout";
import { Input, Button, Alert } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { getAuction, updateAuction } from "@/services/auction.service";
import { Auction, AuctionCategory, CATEGORY_LABELS } from "@/types/auction.types";

// Comprimir imagen a Base64
async function compressImage(file: File, maxWidth: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo crear el contexto del canvas"));
        return;
      }
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.7);
      resolve(base64);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function EditAuctionPage() {
  const router = useRouter();
  const params = useParams();
  const auctionId = params.id as string;
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [auction, setAuction] = useState<Auction | null>(null);
  const [loadingAuction, setLoadingAuction] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other" as AuctionCategory,
    reservePrice: "",
    bidIncrement: "1",
    images: [] as string[],
  });

  // Cargar la subasta
  useEffect(() => {
    async function loadAuction() {
      try {
        const data = await getAuction(auctionId);
        if (!data) {
          setError("Subasta no encontrada");
          return;
        }
        
        // Verificar que el usuario es el dueño
        if (data.sellerId !== user?.uid) {
          setError("No tienes permiso para editar esta subasta");
          return;
        }

        // Verificar que no ha terminado
        if (data.status === "ended" || data.endTime.toDate() < new Date()) {
          setError("No puedes editar una subasta finalizada");
          return;
        }

        setAuction(data);
        setFormData({
          title: data.title,
          description: data.description || "",
          category: data.category,
          reservePrice: data.reservePrice?.toString() || "",
          bidIncrement: data.bidIncrement.toString(),
          images: data.images || [],
        });
      } catch (err) {
        console.error(err);
        setError("Error al cargar la subasta");
      } finally {
        setLoadingAuction(false);
      }
    }

    if (user) {
      loadAuction();
    }
  }, [auctionId, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setError("");

    try {
      const newImages: string[] = [];
      
      for (let i = 0; i < Math.min(files.length, 5 - formData.images.length); i++) {
        const file = files[i];
        
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 10 * 1024 * 1024) {
          setError("Las imágenes no pueden pesar más de 10MB");
          continue;
        }
        
        const base64 = await compressImage(file, 800);
        newImages.push(base64);
      }
      
      setFormData({
        ...formData,
        images: [...formData.images, ...newImages],
      });
    } catch (err) {
      console.error(err);
      setError("Error al procesar las imágenes");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user || !auction) {
      setError("Error de autenticación");
      return;
    }

    if (!formData.title) {
      setError("El título es obligatorio");
      return;
    }

    if (formData.images.length === 0) {
      setError("Debes tener al menos una imagen");
      return;
    }

    setLoading(true);

    try {
      await updateAuction(auctionId, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        images: formData.images,
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : undefined,
        bidIncrement: parseFloat(formData.bidIncrement),
      });

      setSuccess("¡Subasta actualizada exitosamente!");
      
      setTimeout(() => {
        router.push(`/auction/${auctionId}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Error al actualizar la subasta. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <p className="text-gray-400 text-lg">Debes iniciar sesión</p>
          <Button onClick={() => router.push("/login")}>Iniciar sesión</Button>
        </div>
      </div>
    );
  }

  if (loadingAuction) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error && !auction) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <p className="text-red-400 text-lg">{error}</p>
          <Button variant="outline" onClick={() => router.push("/my-auctions")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a mis subastas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Editar subasta</h1>
            <p className="text-slate-500 text-sm">
              Modifica los detalles de tu subasta
            </p>
          </div>
        </div>

        {/* Info importante */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
          <p className="text-amber-400 text-sm">
            <strong>Nota:</strong> No puedes modificar el precio inicial ni la duración una vez creada la subasta.
            {auction && auction.bidsCount > 0 && (
              <span className="block mt-1">
                Esta subasta ya tiene {auction.bidsCount} puja(s).
              </span>
            )}
          </p>
        </div>

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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Precios editables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Input
              label="Incremento mínimo"
              name="bidIncrement"
              type="number"
              step="0.01"
              min="1"
              value={formData.bidIncrement}
              onChange={handleChange}
            />
          </div>

          {/* Info de precio y tiempo (solo lectura) */}
          {auction && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Precio inicial:</span>
                <span className="text-white font-medium">
                  ${auction.startingPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Puja actual:</span>
                <span className="text-emerald-400 font-medium">
                  ${auction.currentBid.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Termina:</span>
                <span className="text-white font-medium">
                  {auction.endTime.toDate().toLocaleString("es-MX")}
                </span>
              </div>
            </div>
          )}

          {/* Imágenes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Imágenes (máximo 5)
            </label>

            {/* Imágenes actuales */}
            {formData.images.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/50 rounded-full p-1 cursor-pointer hover:bg-black/70"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Botón para subir imágenes */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {formData.images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImages}
                className="w-full border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer"
              >
                {uploadingImages ? (
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                ) : (
                  <>
                    <ImagePlus className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">
                      Clic para agregar más imágenes
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      JPG, PNG hasta 10MB
                    </p>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
