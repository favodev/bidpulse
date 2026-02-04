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
import { Navbar, Footer } from "@/components/layout";
import { Button, Alert, ConfirmModal } from "@/components/ui";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  uploadAvatar,
  deleteUserProfile,
} from "@/services/user.service";
import { UserProfile } from "@/types/user.types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser, changePassword, sendEmailVerification, deleteAccount } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [info, setInfo] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Estado para el cropper
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [deletePassword, setDeletePassword] = useState("");

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
        setError(t.profile.errorLoading);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, t]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
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
      setSuccess(t.profile.successMessage);
    } catch (err) {
      console.error(err);
      setError(t.profile.errorSaving);
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
      setError(t.profile.errorImage);
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t.profile.errorImageSize);
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

  const handleSendVerification = async () => {
    if (!user) return;
    setSendingVerification(true);
    setError("");
    setInfo("");

    const result = await sendEmailVerification();
    if (result.success) {
      setInfo(t.profile.verificationSent || "Te enviamos un email de verificación.");
    } else {
      setError(result.error?.message || t.common.error);
    }

    setSendingVerification(false);
  };

  const handleChangePassword = async () => {
    if (!user) return;
    setError("");
    setSuccess("");
    setChangingPassword(true);

    if (passwordForm.newPassword.length < 6) {
      setError(t.profile.passwordMinLength || "La contraseña debe tener al menos 6 caracteres");
      setChangingPassword(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(t.profile.passwordMismatch || "Las contraseñas no coinciden");
      setChangingPassword(false);
      return;
    }

    const result = await changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    );

    if (result.success) {
      setSuccess(t.profile.changePasswordSuccess || "Contraseña actualizada");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setError(result.error?.message || t.profile.changePasswordError || t.common.error);
    }

    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeletingAccount(true);
    setError("");

    const result = await deleteAccount(deletePassword || undefined);
    if (result.success) {
      try {
        await deleteUserProfile(user.uid);
      } catch (err) {
        console.error("Error deleting profile document:", err);
      }
      router.push("/");
    } else {
      setError(result.error?.message || t.common.error);
    }

    setDeletingAccount(false);
    setShowDeleteModal(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <p className="text-gray-400 text-lg">{t.profile.mustLogin}</p>
          <Button onClick={() => router.push("/login")}>{t.profile.loginButton}</Button>
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

  const isPasswordProvider = user.providerData.some(
    (provider) => provider.providerId === "password"
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Navegación */}
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.profile.back}
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">
          {t.profile.title}
        </h1>

        {error && <Alert variant="error" message={error} className="mb-6" />}
        {success && <Alert variant="success" message={success} className="mb-6" />}
        {info && <Alert variant="info" message={info} className="mb-6" />}

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
              <p className="text-emerald-400 text-sm">{t.profile.newPhotoReady}</p>
              <button
                onClick={handleCancelPendingAvatar}
                className="text-gray-500 text-xs hover:text-gray-300 transition-colors cursor-pointer"
              >
                {t.profile.discardChange}
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm mt-2">
              {t.profile.changePhoto}
            </p>
          )}
        </div>

        {/* Verificación de email */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t.profile.emailVerificationTitle || "Verificación de email"}
          </h2>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-slate-300 text-sm">
                {t.profile.email}: {user.email}
              </p>
              <p className={`text-sm ${user.emailVerified ? "text-emerald-400" : "text-amber-400"}`}>
                {user.emailVerified
                  ? t.profile.emailVerified || "Email verificado"
                  : t.profile.emailNotVerified || "Email no verificado"}
              </p>
            </div>
            {!user.emailVerified && (
              <Button onClick={handleSendVerification} isLoading={sendingVerification} size="sm">
                {t.profile.sendVerification || "Enviar verificación"}
              </Button>
            )}
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-slate-900 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            {t.profile.personalInfo}
          </h2>

          <div className="space-y-4">
            {/* Email (solo lectura) */}
            <div>
              <label className="flex text-sm font-medium text-gray-400 mb-2 items-center gap-2">
                <Mail className="w-4 h-4" />
                {t.profile.email}
              </label>
              <div className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-gray-400">
                {user.email}
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="flex text-sm font-medium text-gray-300 mb-2 items-center gap-2">
                <User className="w-4 h-4" />
                {t.profile.displayName}
              </label>
              <input
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder={t.profile.displayNamePlaceholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="flex text-sm font-medium text-gray-300 mb-2 items-center gap-2">
                <FileText className="w-4 h-4" />
                {t.profile.bio}
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder={t.profile.bioPlaceholder}
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
                {t.profile.save}
              </>
            )}
          </Button>
        </div>

        {/* Cambiar contraseña */}
        {isPasswordProvider && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">
              {t.profile.changePasswordTitle || "Cambiar contraseña"}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">
                  {t.profile.currentPassword || "Contraseña actual"}
                </label>
                <input
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">
                  {t.profile.newPassword || "Nueva contraseña"}
                </label>
                <input
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">
                  {t.profile.confirmNewPassword || "Confirmar nueva contraseña"}
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} isLoading={changingPassword} size="sm">
                  {t.profile.changePassword || "Actualizar contraseña"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Zona de peligro */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 mt-8">
          <h2 className="text-lg font-semibold text-red-400 mb-2">
            {t.profile.deleteAccountTitle || "Eliminar cuenta"}
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            {t.profile.deleteAccountDesc || "Esta acción es irreversible."}
          </p>

          {isPasswordProvider && (
            <div className="mb-4">
              <label className="text-sm text-slate-300 mb-1 block">
                {t.profile.currentPassword || "Contraseña actual"}
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="border-red-700 text-red-500 hover:bg-red-950/30 hover:border-red-500"
            onClick={() => setShowDeleteModal(true)}
            isLoading={deletingAccount}
          >
            {t.profile.deleteAccountButton || "Eliminar cuenta"}
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

      <ConfirmModal
        isOpen={showDeleteModal}
        title={t.profile.deleteAccountConfirmTitle || "Eliminar cuenta"}
        message={t.profile.deleteAccountConfirmMessage || "¿Seguro que deseas eliminar tu cuenta?"}
        confirmLabel={t.profile.deleteAccountConfirm || "Eliminar"}
        cancelLabel={t.common.cancel}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
        confirmVariant="danger"
      />

      <Footer />
    </div>
  );
}
