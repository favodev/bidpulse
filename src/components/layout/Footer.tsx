import Link from "next/link";
import Image from "next/image";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Links de navegación del footer */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Plataforma</h4>
            <ul className="space-y-2">
              <li><Link href="/search" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">Explorar subastas</Link></li>
              <li><Link href="/auction/create" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">Vender un artículo</Link></li>
              <li><Link href="/search?category=electronics" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">Electrónica</Link></li>
              <li><Link href="/search?category=fashion" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">Moda</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Cuenta</h4>
            <ul className="space-y-2">
              <li><Link href="/login" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">Iniciar sesión</Link></li>
              <li><Link href="/signup" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">Crear cuenta</Link></li>
              <li><Link href="/my-bids" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">Mis pujas</Link></li>
              <li><Link href="/my-auctions" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">Mis subastas</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Soporte</h4>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">Contacto</Link></li>
              <li><Link href="/favorites" className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">Favoritos</Link></li>
            </ul>
          </div>
        </div>

        {/* Línea divisora */}
        <div className="border-t border-slate-800 pt-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2" aria-label="BidPulse - Inicio">
              <Image
                src="/assets/logo.png"
                alt="BidPulse"
                width={24}
                height={24}
              />
              <span className="text-white font-semibold">BidPulse</span>
            </Link>

            {/* Redes sociales y contacto */}
            <div className="flex items-center gap-2">
              <Link
                href="/contact"
                className="p-2 text-gray-400 hover:text-emerald-500 transition-colors"
                aria-label="Contacto"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </Link>
              <a
                href="https://www.instagram.com/fer_8rtiz/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-pink-500 transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/favodev"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <GitHubIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
