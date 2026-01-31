"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, Menu, X, LogOut, Settings, UserPlus, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuctionAutoFinalize } from "@/hooks/useAuctionAutoFinalize";
import { Button, LanguageToggle } from "@/components/ui";
import { useLanguage } from "@/i18n";

export function Navbar() {
  const { user, userAvatar, logout, loading } = useAuth();
  const { t } = useLanguage();
  useAuctionAutoFinalize(); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Links de navegación con traducciones
  const publicLinks = [
    { href: "/search", label: t.nav.explore },
  ];

  const userLinks = [
    { href: "/my-bids", label: t.nav.myBids },
    { href: "/my-auctions", label: t.nav.myAuctions },
  ];

  // Combinar links según si hay usuario logueado
  const navLinks = user ? [...publicLinks, ...userLinks] : publicLinks;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

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
            <Link href="/auction/create">
              <Button size="sm" variant="primary">
                {t.nav.sellItem}
              </Button>
            </Link>
            
            <LanguageToggle />

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-lg py-2 z-50">
                    {/* Info del usuario */}
                    <div className="px-4 py-2 border-b border-slate-700">
                      <p className="text-white text-sm font-medium truncate">
                        {user.displayName || t.nav.user}
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                      {t.nav.editProfile}
                    </Link>

                    <Link
                      href="/favorites"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <Heart className="w-4 h-4" />
                      {t.nav.favorites}
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      {t.nav.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Botones de login/registro (si no está logueado) */
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button size="sm" variant="ghost">
                    {t.nav.login}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" variant="outline">
                    {t.nav.signup}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Botón menú móvil */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                {/* Language toggle móvil */}
                <div className="flex justify-center pb-2">
                  <LanguageToggle />
                </div>
                
                <Link href="/auction/create" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" variant="primary" fullWidth>
                    {t.nav.sellItem}
                  </Button>
                </Link>

                {user ? (
                  <>
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" variant="ghost" fullWidth>
                        {t.nav.editProfile}
                      </Button>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-2 text-red-400 hover:text-red-300 text-sm font-medium cursor-pointer"
                    >
                      {t.nav.logout}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" variant="ghost" fullWidth>
                        {t.nav.login}
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" variant="outline" fullWidth>
                        {t.nav.signup}
                      </Button>
                    </Link>
                  </>
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
