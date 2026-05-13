"use client";

import { SWRConfig } from 'swr';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig 
      value={{
        fetcher: (url: string) => fetch(url).then(res => res.json()),
        refreshInterval: 5000,
        revalidateOnFocus: true,
        dedupingInterval: 2000
      }}
    >
      {children}
    </SWRConfig>
  );
}
