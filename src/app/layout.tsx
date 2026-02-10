import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationsProvider } from "@/hooks/useNotifications";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { MessageCenterProvider } from "@/hooks/useMessageCenter";
import { LanguageProvider } from "@/i18n";
import { PwaRegister } from "@/components/ui/PwaRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BidPulse",
  description: "Subastas en tiempo real de alto rendimiento con BidPulse. Puja, compite y gana.",
  keywords: ["subastas", "tiempo real", "pujas", "subastas online"],
  manifest: "/manifest.json",
  icons: {
    icon: "/assets/logo.png",
    shortcut: "/assets/logo.png",
    apple: "/assets/logo.png",
  },
};

export const viewport = {
  // place themeColor here per Next.js guidance
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider>
              <NotificationsProvider>
                <MessageCenterProvider>
                  {children}
                  <PwaRegister />
                </MessageCenterProvider>
              </NotificationsProvider>
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
