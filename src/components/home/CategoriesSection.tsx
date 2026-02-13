"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui";
import { useLanguage } from "@/i18n";
import { AuctionCategory } from "@/types/auction.types";

const categories: { id: AuctionCategory; slug: string; gradient: string; image: string }[] = [
  {
    id: "electronics",
    slug: "electronics",
    gradient: "from-blue-900/80 to-blue-950/80",
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80",
  },
  {
    id: "vehicles",
    slug: "vehicles",
    gradient: "from-sky-900/80 to-sky-950/80",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80",
  },
  {
    id: "fashion",
    slug: "fashion",
    gradient: "from-pink-900/80 to-pink-950/80",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80",
  },
  {
    id: "jewelry",
    slug: "jewelry",
    gradient: "from-amber-900/80 to-amber-950/80",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80",
  },
  {
    id: "home",
    slug: "home",
    gradient: "from-orange-900/80 to-orange-950/80",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80",
  },
  {
    id: "sports",
    slug: "sports",
    gradient: "from-green-900/80 to-green-950/80",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80",
  },
  {
    id: "art",
    slug: "art",
    gradient: "from-purple-900/80 to-purple-950/80",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80",
  },
  {
    id: "toys",
    slug: "toys",
    gradient: "from-red-900/80 to-red-950/80",
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80",
  },
];

interface CategoryCardProps {
  name: string;
  slug: string;
  gradient: string;
  image: string;
}

function CategoryCard({ name, slug, gradient, image }: CategoryCardProps) {
  return (
    <Link
      href={`/search?category=${slug}`}
      className="group relative aspect-4/5 rounded-xl overflow-hidden"
    >
      {/* Imagen de fondo */}
      <Image
        src={image}
        alt={name}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-110"
        sizes="(max-width: 768px) 50vw, 25vw"
      />

      {/* Overlay con gradiente */}
      <div
        className={`absolute inset-0 bg-linear-to-t ${gradient} opacity-60 group-hover:opacity-75 transition-opacity mix-blend-multiply`}
      />
      
      {/* Overlay oscuro texto */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-90" />

      {/* Nombre de la categoría */}
      <div className="absolute inset-0 flex items-end p-4 z-10">
        <h3 className="text-white font-bold text-xl tracking-tight drop-shadow-md group-hover:-translate-y-1 transition-transform">
          {name}
        </h3>
      </div>
    </Link>
  );
}

export function CategoriesSection() {
  const { t } = useLanguage();
  
  return (
    <section className="py-16 px-4 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            {t.home.categories}
          </h2>
          <p className="text-slate-400">
            {t.home.categoriesSubtitle}
          </p>
        </div>

        {/* Grid de categorías */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              name={t.categories[category.id as keyof typeof t.categories]}
              slug={category.slug}
              gradient={category.gradient}
              image={category.image}
            />
          ))}
        </div>

        {/* Botón ver todas */}
        <div className="flex justify-center">
          <Link href="/search" aria-label={t.home.viewAll}>
            <Button variant="outline" size="md">
              {t.home.viewAll}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CategoriesSection;
