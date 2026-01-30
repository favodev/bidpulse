"use client";

import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/logo.png"
              alt="BidPulse"
              width={24}
              height={24}
            />
            <span className="text-white font-semibold">BidPulse</span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link href="/search" className="text-gray-400 hover:text-white transition-colors">
              Subastas
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Términos
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacidad
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-gray-500 text-sm">
            © {currentYear} BidPulse
          </p>
        </div>
      </div>
    </footer>
  );
}
