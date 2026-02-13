import Link from "next/link";
import { Navbar, Footer } from "@/components/layout";
import {
  HeroSection,
  EndingSoonSection,
  PopularAuctionsSection,
  CategoriesSection,
} from "@/components/home";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Contenido principal */}
      <main className="flex-1 pt-16">
        <HeroSection />
        <EndingSoonSection />
        <PopularAuctionsSection />
        <CategoriesSection />

        {/* SEO: Contenido indexable server-rendered con texto, encabezados y enlaces internos */}
        <section className="py-16 px-4 bg-slate-900/50 border-t border-slate-800">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              ¿Qué es BidPulse? La plataforma de subastas en tiempo real
            </h2>
            <div className="prose prose-invert max-w-none text-slate-300 space-y-4">
              <p>
                BidPulse es una plataforma moderna de subastas en línea diseñada para conectar compradores y vendedores
                en un entorno rápido, transparente y seguro. Aquí puedes descubrir artículos únicos en diversas categorías,
                desde electrónica y moda hasta arte, joyería, deportes y coleccionables. Cada subasta se desarrolla en
                tiempo real, permitiéndote pujar en vivo contra otros usuarios y ganar los productos que más te interesan
                al mejor precio posible.
              </p>

              <h3 className="text-xl font-semibold text-white mt-8 mb-3">
                ¿Cómo funcionan las subastas en BidPulse?
              </h3>
              <p>
                Participar es sencillo: <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 underline">crea tu cuenta gratuita</Link>,
                explora las subastas disponibles en nuestro <Link href="/search" className="text-emerald-400 hover:text-emerald-300 underline">catálogo completo</Link> y
                realiza tu puja. Si tu oferta es la más alta cuando finaliza el tiempo, el artículo es tuyo. Puedes seguir el estado
                de todas tus pujas en la sección de <Link href="/my-bids" className="text-emerald-400 hover:text-emerald-300 underline">mis pujas</Link> y
                gestionar tus propias ventas desde <Link href="/my-auctions" className="text-emerald-400 hover:text-emerald-300 underline">mis subastas</Link>.
              </p>

              <h3 className="text-xl font-semibold text-white mt-8 mb-3">
                Vende tus artículos en subasta
              </h3>
              <p>
                ¿Tienes artículos que ya no necesitas? Con BidPulse puedes <Link href="/auction/create" className="text-emerald-400 hover:text-emerald-300 underline">crear tu propia subasta</Link> en
                minutos. Sube fotos, establece un precio de salida y deja que los compradores compitan por tu artículo.
                Nuestra plataforma se encarga de las notificaciones, el seguimiento de pujas y la finalización automática
                de la subasta para que tú solo te preocupes de enviar el producto al ganador.
              </p>

              <h3 className="text-xl font-semibold text-white mt-8 mb-3">
                Categorías populares
              </h3>
              <p>
                Encuentra lo que buscas navegando por nuestras categorías más populares:
                {" "}<Link href="/search?category=electronics" className="text-emerald-400 hover:text-emerald-300 underline">Electrónica y Tecnología</Link>,
                {" "}<Link href="/search?category=fashion" className="text-emerald-400 hover:text-emerald-300 underline">Moda y Accesorios</Link>,
                {" "}<Link href="/search?category=vehicles" className="text-emerald-400 hover:text-emerald-300 underline">Vehículos</Link>,
                {" "}<Link href="/search?category=jewelry" className="text-emerald-400 hover:text-emerald-300 underline">Joyería y Relojes</Link>,
                {" "}<Link href="/search?category=art" className="text-emerald-400 hover:text-emerald-300 underline">Arte y Antigüedades</Link>,
                {" "}<Link href="/search?category=sports" className="text-emerald-400 hover:text-emerald-300 underline">Deportes</Link>,
                {" "}<Link href="/search?category=home" className="text-emerald-400 hover:text-emerald-300 underline">Hogar y Decoración</Link> y
                {" "}<Link href="/search?category=toys" className="text-emerald-400 hover:text-emerald-300 underline">Juguetes y Hobbies</Link>.
                Cada día se publican nuevas subastas, así que siempre hay algo interesante esperándote.
              </p>

              <h3 className="text-xl font-semibold text-white mt-8 mb-3">
                Seguridad y confianza
              </h3>
              <p>
                En BidPulse valoramos la transparencia. Cada vendedor tiene un perfil público con reseñas y calificaciones
                de otros compradores. Puedes consultar la reputación de cualquier vendedor antes de pujar, y al finalizar
                una compra puedes dejar tu propia reseña. Si tienes preguntas o necesitas ayuda, nuestro equipo está
                disponible a través de la página de <Link href="/contact" className="text-emerald-400 hover:text-emerald-300 underline">contacto</Link>.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
