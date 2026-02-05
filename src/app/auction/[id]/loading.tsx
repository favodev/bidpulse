import { Navbar, Footer } from "@/components/layout";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="h-72 bg-slate-800/70 rounded animate-pulse" />
            <div className="grid grid-cols-4 gap-2">
              <div className="h-16 bg-slate-800/70 rounded animate-pulse" />
              <div className="h-16 bg-slate-800/70 rounded animate-pulse" />
              <div className="h-16 bg-slate-800/70 rounded animate-pulse" />
              <div className="h-16 bg-slate-800/70 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-10 w-3/4 bg-slate-800/70 rounded animate-pulse" />
            <div className="h-6 w-1/2 bg-slate-800/70 rounded animate-pulse" />
            <div className="h-24 bg-slate-800/70 rounded animate-pulse" />
            <div className="h-12 w-1/3 bg-slate-800/70 rounded animate-pulse" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
