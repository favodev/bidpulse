import Link from "next/link";
import { Button } from "@/components/ui";

const categories = [
  {
    id: "electronics",
    name: "Electrónica",
    slug: "electronics",
    gradient: "from-blue-900/80 to-blue-950/80",
  },
  {
    id: "vehicles",
    name: "Vehículos",
    slug: "vehicles",
    gradient: "from-sky-900/80 to-sky-950/80",
  },
  {
    id: "fashion",
    name: "Moda",
    slug: "fashion",
    gradient: "from-pink-900/80 to-pink-950/80",
  },
  {
    id: "jewelry",
    name: "Joyería y Relojes",
    slug: "jewelry",
    gradient: "from-amber-900/80 to-amber-950/80",
  },
  {
    id: "home",
    name: "Hogar",
    slug: "home",
    gradient: "from-orange-900/80 to-orange-950/80",
  },
  {
    id: "sports",
    name: "Deportes",
    slug: "sports",
    gradient: "from-green-900/80 to-green-950/80",
  },
  {
    id: "art",
    name: "Arte y Antigüedades",
    slug: "art",
    gradient: "from-purple-900/80 to-purple-950/80",
  },
  {
    id: "toys",
    name: "Juguetes y Hobbies",
    slug: "toys",
    gradient: "from-red-900/80 to-red-950/80",
  },
];

interface CategoryCardProps {
  name: string;
  slug: string;
  gradient: string;
}

function CategoryCard({ name, slug, gradient }: CategoryCardProps) {
  return (
    <Link
      href={`/auctions?category=${slug}`}
      className="group relative aspect-4/5 rounded-xl overflow-hidden"
    >
      {/* Fondo placeholder */}
      <div className="absolute inset-0 bg-slate-800" />

      {/* Overlay con gradiente */}
      <div
        className={`absolute inset-0 bg-linear-to-t ${gradient} group-hover:opacity-90 transition-opacity`}
      />

      {/* Nombre de la categoría */}
      <div className="absolute inset-0 flex items-end p-4">
        <h3 className="text-white font-semibold text-lg group-hover:-translate-y-1 transition-transform">
          {name}
        </h3>
      </div>
    </Link>
  );
}

export function CategoriesSection() {
  return (
    <section className="py-16 px-4 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            Explorar por Categoría
          </h2>
          <p className="text-slate-400">
            Descubre artículos únicos en nuestras colecciones más populares.
          </p>
        </div>

        {/* Grid de categorías */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              name={category.name}
              slug={category.slug}
              gradient={category.gradient}
            />
          ))}
        </div>

        {/* Botón ver todas */}
        <div className="flex justify-center">
          <Link href="/auctions">
            <Button variant="outline" size="md">
              Ver Todas las Subastas
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CategoriesSection;
