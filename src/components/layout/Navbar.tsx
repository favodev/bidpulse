"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, User, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui";

const navLinks = [
  { href: "/how-it-works", label: "Cómo Funciona" },
  { href: "/auctions", label: "Subastas" },
  { href: "/community", label: "Comunidad" },
];

export function Navbar() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/assets/logo.png"
              alt="BidPulse Logo"
              width={32}
              height={32}
              priority
            />
            <span className="text-xl font-bold text-white">BidPulse</span>
          </Link>

          {/* Enlaces de navegación */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Acciones */}
          <div className="hidden md:flex items-center gap-4">
            <Button size="sm" variant="primary">
              Vender Artículo
            </Button>

            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <Link
                href="/profile"
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>

          {/* Botón menú móvil */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Menú móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-300 hover:text-white transition-colors text-sm font-medium px-2 py-1"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                <Button size="sm" variant="primary" fullWidth>
                  Vender Artículo
                </Button>
                {!user && (
                  <Link href="/login">
                    <Button size="sm" variant="outline" fullWidth>
                      Iniciar Sesión
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
