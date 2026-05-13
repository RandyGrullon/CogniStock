import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col space-y-10 animate-pulse">
      <div className="space-y-2">
        <div className="h-10 w-64 bg-white/5 rounded-xl" />
        <div className="h-4 w-96 bg-white/5 rounded-lg" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white/5 rounded-[2.5rem] border border-white/5" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px] bg-white/5 rounded-3xl border border-white/5" />
        <div className="h-[400px] bg-white/5 rounded-3xl border border-white/5" />
      </div>
    </div>
  );
}
