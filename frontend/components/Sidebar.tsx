"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Briefcase, Zap, GraduationCap, Settings, Terminal, MessageSquare } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-20 lg:w-64 border-r border-white/5 flex flex-col items-center lg:items-start p-4 lg:p-6 space-y-8 bg-[#0a0a0a]">
      <div className="flex items-center space-x-3 px-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Zap className="text-white w-5 h-5 fill-current" />
        </div>
        <span className="hidden lg:block text-xl font-bold tracking-tight text-white">AI Analyst</span>
      </div>

      <nav className="flex-1 w-full space-y-2">
        <NavItem href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={pathname === "/"} />
        <NavItem href="/portfolio" icon={<Briefcase size={20} />} label="Portafolio" active={pathname === "/portfolio"} />
        <NavItem href="/signals" icon={<Zap size={20} />} label="Señales AI" active={pathname === "/signals"} />
        <NavItem href="/chat" icon={<MessageSquare size={20} />} label="AI Chat" active={pathname === "/chat"} />
        <NavItem href="/logs" icon={<Terminal size={20} />} label="Logs Brain" active={pathname === "/logs"} />
        <NavItem href="/learning" icon={<GraduationCap size={20} />} label="Aprendizaje" active={pathname === "/learning"} />
      </nav>

      <div className="w-full pt-6 border-t border-white/5 space-y-2">
        <NavItem href="/settings" icon={<Settings size={20} />} label="Configuración" active={pathname === "/settings"} />
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`
        flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
        ${active 
          ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' 
          : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'}
      `}
    >
      <span className={`${active ? 'text-blue-500' : 'text-zinc-500 group-hover:text-zinc-200'}`}>
        {icon}
      </span>
      <span className="hidden lg:block text-sm font-medium tracking-wide">
        {label}
      </span>
    </Link>
  );
}
