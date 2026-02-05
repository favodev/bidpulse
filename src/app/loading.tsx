import { Navbar, Footer } from "@/components/layout";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-10 w-2/3 bg-slate-800/70 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-48 bg-slate-800/70 rounded animate-pulse" />
            <div className="h-48 bg-slate-800/70 rounded animate-pulse" />
            <div className="h-48 bg-slate-800/70 rounded animate-pulse" />
          </div>
          <div className="h-6 w-1/2 bg-slate-800/70 rounded animate-pulse" />
          <div className="h-6 w-1/3 bg-slate-800/70 rounded animate-pulse" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
