import "./styles/globals.css";
import type { Metadata, Viewport } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { SupabaseProvider } from "./components/SupabaseProvider";
import StorageInitializer from "./components/StorageInitializer";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import ErrorBoundary from "./components/ErrorBoundary";

// Versão forçada: v1.0.1 [${new Date().toISOString()}]

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#7ad38e"
};

export const metadata: Metadata = {
  title: "BuscaAquiBdC - Classificados",
  description: "A maior plataforma de classificados de Balsas - MA. Encontre veículos, imóveis, eletrônicos e muito mais.",
  keywords: "classificados, balsas, maranhão, veículos, imóveis, eletrônicos, comprar, vender",
  applicationName: "BuscaAquiBdC",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: "index, follow",
  manifest: "/api/manifest",
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
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }
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
        <meta name="version" content="1.0.2" />
        <meta name="build-date" content={new Date().toISOString()} />
        
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BuscaAquiBdC" />
        <meta name="msapplication-TileColor" content="#7ad38e" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        
        
        {/* Register Service Worker - Only in Production */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Check if we're in development mode (localhost or dev port)
              const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.port === '3000' || location.port === '3001' || location.port === '3002';

              if ('serviceWorker' in navigator && !isDevelopment) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              } else if ('serviceWorker' in navigator && isDevelopment) {
                // Unregister any existing service workers in development
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                    console.log('Development mode: Service worker unregistered');
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body key="main-body" className="min-h-screen flex flex-col" suppressHydrationWarning>
        <ErrorBoundary>
          <SupabaseProvider>
            <StorageInitializer />
            <ErrorBoundary
              fallback={
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
                  <p className="text-red-800">Erro ao carregar o cabeçalho. Recarregue a página.</p>
                </div>
              }
            >
              <Header />
            </ErrorBoundary>
            <main className="flex-grow default-page-spacing">{children}</main>
            <Footer />
            <PWAInstallPrompt />
          </SupabaseProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
} 