import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Bell } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Providers from "../components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Stock Analyst | Professional Trading Terminal",
  description: "Plataforma de análisis bursátil impulsada por inteligencia artificial autónoma",
  icons: {
    icon: "/favicon.svg",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-black text-white overflow-hidden`}>
        <Providers>
          <div className="flex h-screen w-screen overflow-hidden bg-[#050505]">
            
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#0a0a0a]/50 backdrop-blur-md shrink-0">
                <div className="flex items-center space-x-4 ml-12 lg:ml-0">
                  <div className="flex items-center space-x-2 text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="hidden xs:inline">Market Open</span>
                  </div>
                  <div className="h-4 w-[1px] bg-white/10 hidden xs:block" />
                  <span className="text-[10px] md:text-xs font-mono text-zinc-400">CogniStock v2.4</span>
                </div>
                
                <div className="flex items-center space-x-3 md:space-x-6">
                  <button className="text-zinc-400 hover:text-white transition-colors relative">
                    <Bell size={18} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                  </button>
                  <div className="flex items-center space-x-3 pl-3 md:pl-4 border-l border-white/10">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">Neural Terminal</p>
                      <p className="text-[8px] text-emerald-500 font-mono mt-1 uppercase">Live Node</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white/10 shadow-[0_0_10px_rgba(37,99,235,0.3)] shrink-0" />
                  </div>
                </div>
              </header>

              <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
