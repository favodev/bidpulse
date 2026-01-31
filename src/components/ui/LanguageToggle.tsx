"use client";

import { useLanguage } from "@/i18n";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-slate-800/50 rounded-lg border border-slate-700/50 p-0.5">
      <button
        onClick={() => setLanguage("es")}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
          language === "es"
            ? "bg-emerald-600 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
        aria-label="Español"
      >
        ES
      </button>
      
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
          language === "en"
            ? "bg-emerald-600 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}

export default LanguageToggle;
