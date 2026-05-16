"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  Zap,
  GraduationCap,
  Settings,
  Terminal,
  MessageSquare,
  LineChart,
  ChevronLeft,
  Menu,
  Network,
  Globe,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NeuralArchitectureModal from "./NeuralArchitectureModal";

const navItems = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { href: "/market", label: "Mercados", icon: <Globe size={20} /> },
  { href: "/trading", label: "Trading", icon: <LineChart size={20} /> },
  { href: "/portfolio", label: "Portafolio", icon: <Briefcase size={20} /> },
  { href: "/signals", label: "Señales AI", icon: <Zap size={20} /> },
  { href: "/chat", label: "AI Chat", icon: <MessageSquare size={20} /> },
  { href: "/logs", label: "Logs Brain", icon: <Terminal size={20} /> },
  { href: "/learning", label: "Aprendizaje", icon: <GraduationCap size={20} /> },
  { href: "/settings", label: "Configuración", icon: <Settings size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed left-3 top-3 z-[60] p-2 rounded-xl bg-[#0a0a0a]/90 border border-white/10 text-zinc-200"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              aria-label="Cerrar menú"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              role="dialog"
              aria-label="Navigation menu"
              className="lg:hidden fixed left-0 top-0 z-50 h-dvh w-[280px] border-r border-white/10 bg-[#0a0a0a] p-4"
            >
              <SidebarContent
                pathname={pathname}
                isCollapsed={false}
                mobile
                onClose={() => setIsMobileOpen(false)}
                onOpenModal={() => setIsModalOpen(true)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }}
        className="hidden h-dvh border-r border-white/5 lg:flex flex-col items-center lg:items-start p-4 lg:p-6 space-y-8 bg-[#0a0a0a] relative z-50 shadow-2xl transition-all duration-300 ease-in-out"
      >
        <SidebarContent
          pathname={pathname}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onOpenModal={() => setIsModalOpen(true)}
        />
      </motion.aside>

      <NeuralArchitectureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

function SidebarContent({
  pathname,
  isCollapsed,
  onToggleCollapse,
  onOpenModal,
  onClose,
  mobile = false,
}: {
  pathname: string;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  onOpenModal: () => void;
  onClose?: () => void;
  mobile?: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between w-full px-2">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="text-white w-5 h-5 fill-current" />
          </div>
          <AnimatePresence>
            {(!isCollapsed || mobile) && (
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

        {mobile ? (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
            aria-label="Colapsar menú"
          >
            {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </div>

      <nav aria-label="Main navigation" className="flex-1 w-full space-y-2 mt-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname === item.href}
            isCollapsed={isCollapsed}
            mobile={mobile}
            onClick={onClose}
          />
        ))}
      </nav>

      <div className="w-full pt-6 border-t border-white/5 space-y-2">
        <button
          onClick={onOpenModal}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative text-zinc-500 hover:bg-blue-600/10 hover:text-blue-400 border border-transparent hover:border-blue-500/20"
        >
          <Network size={20} className="flex-shrink-0" />
          <AnimatePresence>
            {(!isCollapsed || mobile) && (
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
          {!mobile && isCollapsed && (
            <div className="absolute left-14 px-2 py-1 bg-zinc-900 border border-white/10 rounded-md text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-xl">
              Arquitectura Neural
            </div>
          )}
        </button>
      </div>
    </>
  );
}

function NavItem({
  href,
  icon,
  label,
  active = false,
  isCollapsed = false,
  mobile = false,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isCollapsed?: boolean;
  mobile?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
        active
          ? "bg-blue-600/10 text-blue-500 border border-blue-500/20"
          : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
      }`}
    >
      <span className={`${active ? "text-blue-500" : "text-zinc-500 group-hover:text-zinc-200"} flex-shrink-0`}>
        {icon}
      </span>

      <AnimatePresence>
        {(!isCollapsed || mobile) && (
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

      {!mobile && isCollapsed && (
        <div className="absolute left-14 px-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-xs font-bold text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-2xl flex items-center gap-2">
          {label}
        </div>
      )}
    </Link>
  );
}
