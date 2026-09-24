'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/contexto_global/AppContext';
import { LayoutDashboard, Camera, TrendingUp, User, Shield } from 'lucide-react';
import { Logo } from './Logo';

export default function NavigationSidebar() {
  const pathname = usePathname();
  const { role, setRole } = useApp();

  const links = [
    { href: '/', label: 'Inicio', icon: LayoutDashboard },
    { href: '/capture', label: 'Captura', icon: Camera, adminOnly: true },
    { href: '/trends', label: 'Tendencias', icon: TrendingUp },
  ];

  const RoleSelect = (
    <select value={role} onChange={(e) => setRole(e.target.value as any)} className="select-input text-xs w-full" style={{ padding: '6px 10px' }}>
      <option value="admin">Médico (Admin)</option>
      <option value="patient">Paciente</option>
    </select>
  );

  return (
    <>
      {/* Header compacto, visible solo en mobile */}
      <div className="app-shell-header">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Logo />
          <span className="font-bold text-[13px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Neuro Vision
          </span>
        </Link>
        <div style={{ width: 132 }}>{RoleSelect}</div>
      </div>

      <div className="sidebar">
        <div>
          <div className="sidebar-brand-desktop flex items-center gap-2 px-1">
            <Logo size="lg" />
            <div>
              <span className="font-bold text-[13px] tracking-tight block leading-none" style={{ color: 'var(--text-primary)' }}>
                Neuro Vision
              </span>
              <span className="text-[10px] font-mono block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Analytic
              </span>
            </div>
          </div>

          <nav className="sidebar-menu">
            {links.map((link) => {
              if (link.adminOnly && role !== 'admin') return null;
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                  <Icon size={16} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer-desktop pt-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border-card)' }}>
          <div className="flex items-center gap-2 px-1 text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {role === 'admin' ? <Shield size={11} style={{ color: 'var(--accent)' }} /> : <User size={11} style={{ color: 'var(--info)' }} />}
            <span>Rol de Acceso</span>
          </div>
          {RoleSelect}
        </div>
      </div>
    </>
  );
}
