'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/contexto_global/AppContext';
import { useTheme } from '@/contexto_global/ThemeContext';
import { LayoutDashboard, Camera, TrendingUp, User, Shield, Activity, Sun, Moon } from 'lucide-react';

export default function NavigationSidebar() {
  const pathname = usePathname();
  const { role, setRole } = useApp();
  const { theme, toggleTheme } = useTheme();

  const links = [
    { href: '/',        label: 'Dashboard',          icon: LayoutDashboard },
    { href: '/capture', label: 'Registrar Sesión',   icon: Camera, adminOnly: true },
    { href: '/trends',  label: 'Historial y Tendencias', icon: TrendingUp },
  ];

  return (
    <div className="sidebar">
      <div>
        {/* Logo + Theme Toggle */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {/* Logo mark — squared Worklog style */}
            <div className="flex items-center justify-center w-7 h-7 rounded"
              style={{
                background: 'var(--success)',
                color: 'var(--bg-primary)'
              }}>
              <Activity size={14} strokeWidth={2.5} />
            </div>
            <div>
              <span
                className="font-bold text-[13px] tracking-tight block leading-none"
                style={{ color: 'var(--text-primary)' }}
              >
                Neuro Vision
              </span>
              <span
                className="text-[10px] font-mono block mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Analytic · v2.0
              </span>
            </div>
          </div>

          {/* Dark / Light toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark'
              ? <Sun size={14} />
              : <Moon size={14} />
            }
          </button>
        </div>

        {/* Menu Links */}
        <nav className="sidebar-menu">
          {links.map((link) => {
            if (link.adminOnly && role !== 'admin') return null;
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Role Switcher */}
      <div style={{ borderTop: '1px solid var(--border-color)' }} className="pt-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1 text-[10px] font-mono font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}>
          {role === 'admin'
            ? <Shield size={11} style={{ color: 'var(--success)' }} />
            : <User size={11} style={{ color: 'var(--info)' }} />
          }
          <span>Rol de Acceso</span>
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="select-input text-xs w-full"
          style={{ padding: '6px 10px' }}
        >
          <option value="admin">Médico (Admin)</option>
          <option value="patient">Paciente (Autenticado)</option>
        </select>
      </div>
    </div>
  );
}
