"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Camera,
  Save,
  Loader2,
  Mail,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { Navbar } from "@/components/layout";
import { Button, Alert } from "@/components/ui";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  uploadAvatar,
} from "@/services/user.service";
import { UserProfile } from "@/types/user.types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Estado para el cropper
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
  });

  // Cargar perfil
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        let userProfile = await getUserProfile(user.uid);

        if (!userProfile) {
          await createUserProfile(user.uid, user.email || "", user.displayName || "");
          userProfile = await getUserProfile(user.uid);
        }

        if (userProfile) {
          setProfile(userProfile);
          setFormData({
            displayName: userProfile.displayName || "",
            bio: userProfile.bio || "",
          });
        }
      } catch (err) {
        console.error(err);
        setError("Error al cargar el perfil");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Si hay un avatar pendiente, subirlo primero
      if (pendingAvatarBlob) {
        const file = new File([pendingAvatarBlob], "avatar.jpg", { type: "image/jpeg" });
        const newAvatarUrl = await uploadAvatar(user.uid, file);
        setProfile((prev) => (prev ? { ...prev, avatar: newAvatarUrl } : null));
        
        // Limpiar estados del avatar
        setPreviewAvatar(null);
        setPendingAvatarBlob(null);
      }

      await updateUserProfile(user.uid, {
        displayName: formData.displayName,
        bio: formData.bio,
      });

      refreshUser();
      setSuccess("Perfil actualizado correctamente");
    } catch (err) {
      console.error(err);
      setError("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona una imagen válida");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede pesar más de 5MB");
      return;
    }

    // Leer archivo y mostrar cropper
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    
    e.target.value = "";
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const previewUrl = URL.createObjectURL(croppedBlob);
    setPreviewAvatar(previewUrl);
    setPendingAvatarBlob(croppedBlob);
    setShowCropper(false);
    setSelectedImage(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
  };

  // Función para cancelar el avatar pendiente
  const handleCancelPendingAvatar = () => {
    if (previewAvatar) {
      URL.revokeObjectURL(previewAvatar);
    }
    setPreviewAvatar(null);
    setPendingAvatarBlob(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <p className="text-gray-400 text-lg">Debes iniciar sesión para ver tu perfil</p>
          <Button onClick={() => router.push("/login")}>Iniciar sesión</Button>
        </div>
      </div>
    );
  }

  if (loading) {
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
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navegación */}
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">
          Editar Perfil
        </h1>

        {error && <Alert variant="error" message={error} className="mb-6" />}
        {success && <Alert variant="success" message={success} className="mb-6" />}

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div
              onClick={handleAvatarClick}
              className="w-32 h-32 rounded-full bg-slate-900 border-4 border-slate-800 overflow-hidden cursor-pointer group"
            >
              {previewAvatar || profile?.avatar ? (
                <img
                  src={previewAvatar || profile?.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-500" />
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {previewAvatar ? (
            <div className="flex flex-col items-center gap-2 mt-2">
              <p className="text-emerald-400 text-sm">✓ Nueva foto lista</p>
              <button
                onClick={handleCancelPendingAvatar}
                className="text-gray-500 text-xs hover:text-gray-300 transition-colors cursor-pointer"
              >
                Descartar cambio
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm mt-2">
              Haz clic para cambiar tu foto
            </p>
          )}
        </div>

        {/* Formulario */}
        <div className="bg-slate-900 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            Información personal
          </h2>

          <div className="space-y-4">
            {/* Email (solo lectura) */}
            <div>
              <label className="flex text-sm font-medium text-gray-400 mb-2 items-center gap-2">
                <Mail className="w-4 h-4" />
                Correo electrónico
              </label>
              <div className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-400">
                {user.email}
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="flex text-sm font-medium text-gray-300 mb-2 items-center gap-2">
                <User className="w-4 h-4" />
                Nombre para mostrar
              </label>
              <input
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Tu nombre"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="flex text-sm font-medium text-gray-300 mb-2 items-center gap-2">
                <FileText className="w-4 h-4" />
                Biografía
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Cuéntanos sobre ti..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Botón guardar */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </main>

      {/* Modal de recorte de imagen */}
      {showCropper && selectedImage && (
        <ImageCropper
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          isUploading={false}
        />
      )}
    </div>
  );
}
