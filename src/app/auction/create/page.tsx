"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Input, Button, Alert } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";
import { createAuction } from "@/services/auction.service";
import { AuctionCategory } from "@/types/auction.types";

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

export default function CreateAuctionPage() {
  const router = useRouter();
  const { user, userAvatar } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
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

    if (!user) {
      setError(t.createAuction.mustLogin);
      return;
    }

    if (!formData.title || !formData.startingPrice) {
      setError(t.createAuction.fillRequired);
      return;
    }

    if (formData.images.length === 0) {
      setError(t.createAuction.addOneImage);
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
          images: formData.images,
          startingPrice: parseFloat(formData.startingPrice),
          reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : undefined,
          bidIncrement: parseFloat(formData.bidIncrement),
          startTime: now,
          endTime: endDate,
        },
        user.uid,
        user.displayName || "Vendedor",
        userAvatar || undefined
      );

      setSuccess(t.createAuction.success);
      
      setTimeout(() => {
        router.push(`/auction/${auctionId}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(t.createAuction.error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <p className="text-gray-400 text-lg">{t.createAuction.mustLogin}</p>
          <Button onClick={() => router.push("/login")}>{t.nav.login}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">
          {t.createAuction.title}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert variant="error" message={error} />}
          {success && <Alert variant="success" message={success} />}

          {/* Título */}
          <Input
            label={`${t.createAuction.auctionTitle} *`}
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t.createAuction.auctionTitlePlaceholder}
          />

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.createAuction.description}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder={t.createAuction.descriptionPlaceholder}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.createAuction.category}
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
            >
              {Object.keys(t.categories).map((key) => (
                <option key={key} value={key}>
                  {t.categories[key as keyof typeof t.categories]}
                </option>
              ))}
            </select>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`${t.createAuction.startingPrice} *`}
              name="startingPrice"
              type="number"
              step="0.01"
              min="1"
              value={formData.startingPrice}
              onChange={handleChange}
              placeholder="100.00"
            />
            <Input
              label={t.createAuction.reservePrice}
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
              label={t.createAuction.bidIncrement}
              name="bidIncrement"
              type="number"
              step="0.01"
              min="1"
              value={formData.bidIncrement}
              onChange={handleChange}
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t.createAuction.duration}
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="1">1 {t.createAuction.day}</option>
                <option value="3">3 {t.createAuction.days}</option>
                <option value="5">5 {t.createAuction.days}</option>
                <option value="7">7 {t.createAuction.days}</option>
                <option value="14">14 {t.createAuction.days}</option>
              </select>
            </div>
          </div>

          {/* Imágenes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t.createAuction.images} ({t.createAuction.imagesHint})
            </label>

            {/* Imágenes seleccionadas */}
            {formData.images.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/50 rounded-full p-1 cursor-pointer"
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
                      {t.createAuction.addImages}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {t.createAuction.imageFormat}
                    </p>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Botón submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              t.createAuction.create
            )}
          </Button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
