"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Shield,
  LayoutGrid,
  Flag,
  UserCheck,
} from "lucide-react";
import { Navbar, Footer } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [user, isAdmin, authLoading, router]);

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const adminSections = [
    {
      title: t.admin?.categories || "Categories",
      description: t.admin?.categoriesDesc || "Manage auction categories",
      href: "/admin/categories",
      icon: LayoutGrid,
      color: "bg-emerald-500/20 text-emerald-400",
    },
    {
      title: t.admin?.verificationsLink || "Verifications",
      description: t.admin?.verificationsDesc || "Approve or reject seller verification requests",
      href: "/admin/verifications",
      icon: UserCheck,
      color: "bg-green-500/20 text-green-400",
    },
    {
      title: t.admin?.reportsLink || "Reports",
      description: t.admin?.reportsDesc || "Review user and auction reports",
      href: "/admin/reports",
      icon: Flag,
      color: "bg-red-500/20 text-red-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t.admin?.title || "Admin Panel"}</h1>
            <p className="text-slate-400 text-sm">{t.admin?.subtitle || "Manage the BidPulse platform"}</p>
          </div>
        </div>

        {/* Admin sections grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-colors group"
              >
                <div className={`p-3 rounded-lg ${section.color} w-fit mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-white font-semibold mb-1 group-hover:text-emerald-400 transition-colors">
                  {section.title}
                </h2>
                <p className="text-slate-400 text-sm">{section.description}</p>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
