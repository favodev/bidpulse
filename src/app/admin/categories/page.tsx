"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  X,
  Shield,
  LayoutGrid,
  Database,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { Button, Alert, Input, ConfirmModal } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
  seedDefaultCategories,
  DynamicCategory,
  CreateCategoryData,
} from "@/services/category.service";

const GRADIENT_OPTIONS = [
  { value: "from-blue-900/80 to-blue-950/80", label: "Blue", color: "bg-blue-600" },
  { value: "from-sky-900/80 to-sky-950/80", label: "Sky", color: "bg-sky-600" },
  { value: "from-pink-900/80 to-pink-950/80", label: "Pink", color: "bg-pink-600" },
  { value: "from-orange-900/80 to-orange-950/80", label: "Orange", color: "bg-orange-600" },
  { value: "from-green-900/80 to-green-950/80", label: "Green", color: "bg-green-600" },
  { value: "from-red-900/80 to-red-950/80", label: "Red", color: "bg-red-600" },
  { value: "from-purple-900/80 to-purple-950/80", label: "Purple", color: "bg-purple-600" },
  { value: "from-amber-900/80 to-amber-950/80", label: "Amber", color: "bg-amber-600" },
  { value: "from-indigo-900/80 to-indigo-950/80", label: "Indigo", color: "bg-indigo-600" },
  { value: "from-teal-900/80 to-teal-950/80", label: "Teal", color: "bg-teal-600" },
  { value: "from-rose-900/80 to-rose-950/80", label: "Rose", color: "bg-rose-600" },
  { value: "from-slate-900/80 to-slate-950/80", label: "Slate", color: "bg-slate-600" },
];

interface CategoryFormData {
  slug: string;
  nameEs: string;
  nameEn: string;
  gradient: string;
  image: string;
  order: number;
}

const emptyForm: CategoryFormData = {
  slug: "",
  nameEs: "",
  nameEn: "",
  gradient: "from-blue-900/80 to-blue-950/80",
  image: "",
  order: 99,
};

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await getCategories(false);
      setCategories(data);
    } catch (err) {
      console.error("Error loading categories:", err);
      setError("Error al cargar las categorías");
    } finally {
      setLoading(false);
    }
  }

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      await seedDefaultCategories();
      await loadCategories();
      setSuccess("Categorías por defecto creadas exitosamente");
    } catch (err) {
      setError("Error al crear categorías por defecto");
    } finally {
      setSeeding(false);
    }
  };

  const handleEditClick = (cat: DynamicCategory) => {
    setEditingId(cat.id);
    setFormData({
      slug: cat.slug,
      nameEs: cat.nameEs,
      nameEn: cat.nameEn,
      gradient: cat.gradient,
      image: cat.image,
      order: cat.order,
    });
    setShowForm(true);
  };

  const handleNewClick = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.slug || !formData.nameEs || !formData.nameEn) {
      setError("Slug, nombre ES y nombre EN son requeridos");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await updateCategory(editingId, formData);
        setSuccess("Categoría actualizada");
      } else {
        await createCategory(formData as CreateCategoryData);
        setSuccess("Categoría creada");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      await loadCategories();
    } catch (err) {
      setError("Error al guardar la categoría");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSuccess("Categoría eliminada");
      setDeleteConfirm(null);
    } catch (err) {
      setError("Error al eliminar la categoría");
    }
  };

  const handleToggleActive = async (cat: DynamicCategory) => {
    try {
      await toggleCategoryActive(cat.id, !cat.isActive);
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch (err) {
      setError("Error al cambiar estado");
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                {t.admin?.categoriesTitle || "Gestión de Categorías"}
              </h1>
            </div>
            <p className="text-slate-500 ml-13">
              {t.admin?.categoriesSubtitle || "Administra las categorías de subastas"}
            </p>
          </div>
          <div className="flex gap-2">
            {categories.length === 0 && (
              <Button
                variant="outline"
                onClick={handleSeedDefaults}
                isLoading={seeding}
                leftIcon={<Database className="w-4 h-4" />}
              >
                {t.admin?.seedDefaults || "Cargar por defecto"}
              </Button>
            )}
            <Button onClick={handleNewClick} leftIcon={<Plus className="w-4 h-4" />}>
              {t.admin?.addCategory || "Nueva categoría"}
            </Button>
          </div>
        </div>

        {error && <div className="mb-4"><Alert variant="error" message={error} /></div>}
        {success && <div className="mb-4"><Alert variant="success" message={success} /></div>}

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {editingId
                  ? (t.admin?.editCategory || "Editar categoría")
                  : (t.admin?.newCategory || "Nueva categoría")}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="electronics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Orden</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre (ES)</label>
                <input
                  type="text"
                  value={formData.nameEs}
                  onChange={(e) => setFormData({ ...formData, nameEs: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Electrónica y Tecnología"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre (EN)</label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Electronics & Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">URL de imagen</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Color</label>
                <div className="flex flex-wrap gap-2">
                  {GRADIENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFormData({ ...formData, gradient: opt.value })}
                      className={`w-8 h-8 rounded-lg ${opt.color} transition-all ${
                        formData.gradient === opt.value
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => { setShowForm(false); setEditingId(null); }}
              >
                {t.common?.cancel || "Cancelar"}
              </Button>
              <Button
                onClick={handleSave}
                isLoading={saving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {t.common?.save || "Guardar"}
              </Button>
            </div>
          </div>
        )}

        {/* Categories Table */}
        {categories.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <LayoutGrid className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {t.admin?.noCategories || "No hay categorías"}
            </h3>
            <p className="text-slate-500 mb-6">
              {t.admin?.noCategoriesDesc || "Carga las categorías por defecto o crea nuevas"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`bg-slate-900 border rounded-xl p-4 flex items-center gap-4 transition-colors ${
                  cat.isActive ? "border-slate-800 hover:border-slate-700" : "border-slate-800/50 opacity-60"
                }`}
              >
                <GripVertical className="w-5 h-5 text-slate-600 shrink-0 cursor-grab" />

                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.nameEs} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-linear-to-br ${cat.gradient}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white truncate">{cat.nameEs}</h3>
                    <span className="text-xs text-slate-500">({cat.nameEn})</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span>slug: {cat.slug}</span>
                    <span>orden: {cat.order}</span>
                    <span>{cat.auctionCount} subastas</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className={`p-2 rounded-lg transition-colors ${
                      cat.isActive
                        ? "text-emerald-400 hover:bg-emerald-500/20"
                        : "text-slate-500 hover:bg-slate-800"
                    }`}
                    title={cat.isActive ? "Desactivar" : "Activar"}
                  >
                    {cat.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEditClick(cat)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(cat.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Eliminar categoría"
        message="¿Estás seguro de eliminar esta categoría? Esto no afectará las subastas existentes."
        confirmLabel={t.common?.delete || "Eliminar"}
        cancelLabel={t.common?.cancel || "Cancelar"}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
        confirmVariant="danger"
      />
    </div>
  );
}
