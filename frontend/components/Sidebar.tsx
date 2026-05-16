"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, Briefcase, Zap, GraduationCap, 
  Settings, Terminal, MessageSquare, LineChart,
  ChevronLeft, ChevronRight, Menu, Network, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NeuralArchitectureModal from './NeuralArchitectureModal';

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }}
        className="h-screen border-r border-white/5 flex flex-col items-center lg:items-start p-4 lg:p-6 space-y-8 bg-[#0a0a0a] relative z-50 shadow-2xl transition-all duration-300 ease-in-out"
      >
        <div className="flex items-center justify-between w-full px-2">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="text-white w-5 h-5 fill-current" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-xl font-bold tracking-tight text-white whitespace-nowrap"
                >
                  AI Analyst
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
          >
            {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 w-full space-y-2 mt-4">
          <NavItem href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={pathname === "/"} isCollapsed={isCollapsed} />
          <NavItem href="/market" icon={<Globe size={20} />} label="Mercados" active={pathname === "/market"} isCollapsed={isCollapsed} />
          <NavItem href="/trading" icon={<LineChart size={20} />} label="Trading" active={pathname === "/trading"} isCollapsed={isCollapsed} />
          <NavItem href="/portfolio" icon={<Briefcase size={20} />} label="Portafolio" active={pathname === "/portfolio"} isCollapsed={isCollapsed} />
          <NavItem href="/signals" icon={<Zap size={20} />} label="Señales AI" active={pathname === "/signals"} isCollapsed={isCollapsed} />
          <NavItem href="/chat" icon={<MessageSquare size={20} />} label="AI Chat" active={pathname === "/chat"} isCollapsed={isCollapsed} />
          <NavItem href="/logs" icon={<Terminal size={20} />} label="Logs Brain" active={pathname === "/logs"} isCollapsed={isCollapsed} />
          <NavItem href="/learning" icon={<GraduationCap size={20} />} label="Aprendizaje" active={pathname === "/learning"} isCollapsed={isCollapsed} />
        </nav>

        <div className="w-full pt-6 border-t border-white/5 space-y-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className={`
              w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
              text-zinc-500 hover:bg-blue-600/10 hover:text-blue-400 border border-transparent hover:border-blue-500/20
            `}
          >
            <Network size={20} className="flex-shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-sm font-medium tracking-wide whitespace-nowrap"
                >
                  Arquitectura Neural
                </motion.span>
              )}
            </AnimatePresence>
            {isCollapsed && (
              <div className="absolute left-14 px-2 py-1 bg-zinc-900 border border-white/10 rounded-md text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-xl">
                Arquitectura Neural
              </div>
            )}
          </button>
          <NavItem href="/settings" icon={<Settings size={20} />} label="Configuración" active={pathname === "/settings"} isCollapsed={isCollapsed} />
        </div>
      </motion.aside>

      <NeuralArchitectureModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}

function NavItem({ href, icon, label, active = false, isCollapsed = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean, isCollapsed?: boolean }) {
  return (
    <Link 
      href={href}
      className={`
        flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
        ${active 
          ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' 
          : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'}
      `}
    >
      <span className={`${active ? 'text-blue-500' : 'text-zinc-500 group-hover:text-zinc-200'} flex-shrink-0`}>
        {icon}
      </span>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-sm font-medium tracking-wide whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {isCollapsed && (
        <div className="absolute left-14 px-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-xs font-bold text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-2xl flex items-center gap-2">
          {label}
        </div>
      )}
    </Link>
  );
}
