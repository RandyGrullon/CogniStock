import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Bell } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Providers from "../components/Providers";
import PWARegister from "../components/PWARegister";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Stock Analyst | Professional Trading Terminal",
  description: "Plataforma de análisis bursátil impulsada por inteligencia artificial autónoma",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-icon",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CogniStock",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-black text-white overflow-x-hidden`}>
        <Providers>
          <PWARegister />
          <div className="flex min-h-screen h-dvh w-full overflow-hidden bg-[#050505]">
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="h-14 sm:h-16 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-8 pl-16 lg:pl-8 bg-[#0a0a0a]/70 backdrop-blur-md">
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-zinc-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>Market Open</span>
                  </div>
                  <div className="hidden sm:block h-4 w-[1px] bg-white/10" />
                  <span className="text-xs font-mono text-zinc-400">CogniStock v2.1</span>
                </div>

                <div className="flex items-center space-x-3 sm:space-x-6">
                  <button className="text-zinc-400 hover:text-white transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                  </button>
                  <div className="flex items-center space-x-3 pl-3 sm:pl-4 border-l border-white/10">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-black text-white uppercase tracking-tighter">Neural Terminal</p>
                      <p className="text-[10px] text-emerald-500 font-mono">Live Monitoring</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white/10 shadow-[0_0_10px_rgba(37,99,235,0.3)]" />
                  </div>
                </div>
              </header>

              <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth custom-scrollbar">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
