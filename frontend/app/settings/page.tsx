import React from "react";

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter">
          Configuración
        </h1>
        <p className="text-zinc-500 mt-2 max-w-2xl">
          Ajustes del terminal y preferencias de la red neural.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-3xl space-y-6">
          <h3 className="text-lg font-bold text-white">API Keys</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Groq API Key
              </label>
              <input 
                type="password" 
                value="••••••••••••••••" 
                disabled
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-400 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Supabase URL
              </label>
              <input 
                type="text" 
                value="https://••••••••.supabase.co" 
                disabled
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-400 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-3xl space-y-6">
          <h3 className="text-lg font-bold text-white">Preferencias de Trading</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">Modo Auto-Trading</p>
                <p className="text-xs text-zinc-500">Permitir que la AI abra posiciones (Próximamente)</p>
              </div>
              <div className="w-12 h-6 bg-zinc-800 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-zinc-600 rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">Notificaciones Push</p>
                <p className="text-xs text-zinc-500">Alertas de señales de alta probabilidad</p>
              </div>
              <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-3xl">
        <p className="text-xs text-zinc-400 italic">
          * Nota: La configuración se guarda localmente en el navegador y en las variables de entorno de Vercel.
        </p>
      </div>
    </div>
  );
}
