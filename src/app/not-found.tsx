import Link from "next/link";
import { Home, Search, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        {/* Número 404 */}
        <div className="relative">
          <h1 className="text-[150px] sm:text-[200px] font-bold text-slate-800 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Mensaje */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 -mt-8">
          Página no encontrada
        </h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
          >
            <Home className="w-5 h-5" />
            Ir al inicio
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
          >
            <Search className="w-5 h-5" />
            Explorar subastas
          </Link>
        </div>
      </div>
    </div>
  );
}
