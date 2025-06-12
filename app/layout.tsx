import "./styles/globals.css";
import type { Metadata, Viewport } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { SupabaseProvider } from "./components/SupabaseProvider";
import StorageInitializer from "./components/StorageInitializer";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

// Versão forçada: v1.0.1 [${new Date().toISOString()}]

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f5c842"
};

export const metadata: Metadata = {
  title: "BuscaAquiBdC - Classificados",
  description: "A maior plataforma de classificados de Balsas - MA. Encontre veículos, imóveis, eletrônicos e muito mais.",
  keywords: "classificados, balsas, maranhão, veículos, imóveis, eletrônicos, comprar, vender",
  applicationName: "BuscaAquiBdC",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: "index, follow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BuscaAquiBdC"
  },
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" }
    ]
  },
  openGraph: {
    type: "website",
    title: "BuscaAquiBdC - Classificados",
    description: "A maior plataforma de classificados de Balsas - MA",
    siteName: "BuscaAquiBdC",
    locale: "pt_BR"
  },
  twitter: {
    card: "summary_large_image",
    title: "BuscaAquiBdC - Classificados",
    description: "A maior plataforma de classificados de Balsas - MA"
  }
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="version" content="1.0.1" />
        <meta name="build-date" content={new Date().toISOString()} />
        
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BuscaAquiBdC" />
        <meta name="msapplication-TileColor" content="#f5c842" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        
        {/* Safari Pinned Tab */}
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#f5c842" />
        
        {/* Register Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body key="main-body" className="min-h-screen flex flex-col" suppressHydrationWarning>
        <SupabaseProvider>
          <StorageInitializer />
          <Header />
          <main className="flex-grow default-page-spacing">{children}</main>
          <Footer />
          <PWAInstallPrompt />
        </SupabaseProvider>
      </body>
    </html>
  );
} 