import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const CATEGORIES_COLLECTION = "categories";
const categoriesRef = collection(db, CATEGORIES_COLLECTION);

export interface DynamicCategory {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  icon: string;
  gradient: string;
  image: string;
  order: number;
  isActive: boolean;
  auctionCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateCategoryData {
  slug: string;
  nameEs: string;
  nameEn: string;
  icon?: string;
  gradient?: string;
  image?: string;
  order?: number;
}

export async function getCategories(onlyActive = true): Promise<DynamicCategory[]> {
  try {
    const q = onlyActive
      ? query(categoriesRef, where("isActive", "==", true), orderBy("order", "asc"))
      : query(categoriesRef, orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    const categories: DynamicCategory[] = [];

    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() } as DynamicCategory);
    });

    return categories;
  } catch (error) {
    console.error("[CategoryService] Error getting categories:", error);
    return [];
  }
}

export async function getCategory(categoryId: string): Promise<DynamicCategory | null> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return { id: docSnap.id, ...docSnap.data() } as DynamicCategory;
  } catch (error) {
    console.error("[CategoryService] Error getting category:", error);
    return null;
  }
}

export async function createCategory(data: CreateCategoryData): Promise<string> {
  try {
    const docRef = await addDoc(categoriesRef, {
      ...data,
      icon: data.icon || "Package",
      gradient: data.gradient || "from-slate-900/80 to-slate-950/80",
      image: data.image || "",
      order: data.order ?? 99,
      isActive: true,
      auctionCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("[CategoryService] Error creating category:", error);
    throw error;
  }
}

export async function updateCategory(
  categoryId: string,
  data: Partial<Omit<DynamicCategory, "id" | "createdAt">>
): Promise<void> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[CategoryService] Error updating category:", error);
    throw error;
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("[CategoryService] Error deleting category:", error);
    throw error;
  }
}

export async function toggleCategoryActive(categoryId: string, isActive: boolean): Promise<void> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[CategoryService] Error toggling category:", error);
    throw error;
  }
}

export async function seedDefaultCategories(): Promise<void> {
  const existingCategories = await getCategories(false);
  if (existingCategories.length > 0) return;

  const defaults: CreateCategoryData[] = [
    { slug: "electronics", nameEs: "Electrónica y Tecnología", nameEn: "Electronics & Technology", icon: "Monitor", gradient: "from-blue-900/80 to-blue-950/80", image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80", order: 1 },
    { slug: "vehicles", nameEs: "Vehículos y Accesorios", nameEn: "Vehicles & Accessories", icon: "Car", gradient: "from-sky-900/80 to-sky-950/80", image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80", order: 2 },
    { slug: "fashion", nameEs: "Ropa, Zapatos y Accesorios", nameEn: "Clothing, Shoes & Accessories", icon: "Shirt", gradient: "from-pink-900/80 to-pink-950/80", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80", order: 3 },
    { slug: "home", nameEs: "Hogar y Decoración", nameEn: "Home & Decor", icon: "Home", gradient: "from-orange-900/80 to-orange-950/80", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80", order: 4 },
    { slug: "sports", nameEs: "Deportes y Fitness", nameEn: "Sports & Fitness", icon: "Dumbbell", gradient: "from-green-900/80 to-green-950/80", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80", order: 5 },
    { slug: "toys", nameEs: "Juguetes y Hobbies", nameEn: "Toys & Hobbies", icon: "Gamepad2", gradient: "from-red-900/80 to-red-950/80", image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80", order: 6 },
    { slug: "books", nameEs: "Libros, Películas y Música", nameEn: "Books, Movies & Music", icon: "BookOpen", gradient: "from-indigo-900/80 to-indigo-950/80", image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80", order: 7 },
    { slug: "music", nameEs: "Instrumentos Musicales", nameEn: "Musical Instruments", icon: "Music", gradient: "from-violet-900/80 to-violet-950/80", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80", order: 8 },
    { slug: "art", nameEs: "Arte y Antigüedades", nameEn: "Art & Antiques", icon: "Palette", gradient: "from-purple-900/80 to-purple-950/80", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80", order: 9 },
    { slug: "antiques", nameEs: "Coleccionables y Memorabilia", nameEn: "Collectibles & Memorabilia", icon: "Clock", gradient: "from-amber-900/80 to-amber-950/80", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80", order: 10 },
    { slug: "jewelry", nameEs: "Joyería y Relojes", nameEn: "Jewelry & Watches", icon: "Gem", gradient: "from-amber-900/80 to-amber-950/80", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80", order: 11 },
    { slug: "tools", nameEs: "Herramientas y Bricolaje", nameEn: "Tools & DIY", icon: "Wrench", gradient: "from-gray-900/80 to-gray-950/80", image: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&q=80", order: 12 },
    { slug: "garden", nameEs: "Jardín y Exterior", nameEn: "Garden & Outdoor", icon: "Sprout", gradient: "from-lime-900/80 to-lime-950/80", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80", order: 13 },
    { slug: "pets", nameEs: "Mascotas y Accesorios", nameEn: "Pets & Accessories", icon: "PawPrint", gradient: "from-teal-900/80 to-teal-950/80", image: "https://images.unsplash.com/photo-1450778869180-e25c15372824?auto=format&fit=crop&q=80", order: 14 },
    { slug: "baby", nameEs: "Bebés y Niños", nameEn: "Baby & Kids", icon: "Baby", gradient: "from-rose-900/80 to-rose-950/80", image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80", order: 15 },
    { slug: "health", nameEs: "Salud y Belleza", nameEn: "Health & Beauty", icon: "Heart", gradient: "from-fuchsia-900/80 to-fuchsia-950/80", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80", order: 16 },
    { slug: "other", nameEs: "Otros", nameEn: "Other", icon: "Package", gradient: "from-slate-900/80 to-slate-950/80", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80", order: 99 },
  ];

  for (const cat of defaults) {
    await createCategory(cat);
  }
}
