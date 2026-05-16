export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg text-center p-8 rounded-3xl border border-white/10 bg-zinc-900/60 space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Sin conexión</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          CogniStock no puede sincronizar datos en este momento. Revisa tu conexión y vuelve a intentarlo.
        </p>
      </div>
    </div>
  );
}
