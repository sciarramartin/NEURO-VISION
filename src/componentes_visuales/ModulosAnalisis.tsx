'use client';

import React from 'react';
import Link from 'next/link';
import {
  Footprints, Ruler, ScanFace, FlaskConical, Waves, RotateCcw, ClipboardList,
  LucideIcon
} from 'lucide-react';

interface Modulo {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  disponible: boolean;
}

const MODULOS: Modulo[] = [
  {
    href: '/analisis/paso',
    icon: Footprints,
    title: '1. Longitud del paso',
    desc: 'Marcha filmada de perfil, cuerpo completo.',
    disponible: true,
  },
  {
    href: '/analisis/goniometro',
    icon: Ruler,
    title: '2. Goniómetro',
    desc: 'Rango de movimiento activo por articulación.',
    disponible: true,
  },
  {
    href: '/analisis/facial',
    icon: ScanFace,
    title: '3. Análisis facial',
    desc: 'Selección de músculo y contracción guiada.',
    disponible: true,
  },
  {
    href: '/analisis/proximamente?modulo=Laboratorio+de+marcha+complejo',
    icon: FlaskConical,
    title: '4. Laboratorio de marcha compleja',
    desc: 'Análisis multivariable de la marcha.',
    disponible: false,
  },
  {
    href: '/analisis/proximamente?modulo=Movimientos+anormales',
    icon: Waves,
    title: '5. Movimientos anormales',
    desc: 'Discinesias, mioclonías, tics.',
    disponible: false,
  },
  {
    href: '/analisis/proximamente?modulo=Distonía+cervical',
    icon: RotateCcw,
    title: '6. Distonía cervical',
    desc: 'Patrón y amplitud de la tortícolis.',
    disponible: false,
  },
  {
    href: '/analisis/proximamente?modulo=UPDRS+III',
    icon: ClipboardList,
    title: '7. UPDRS III',
    desc: 'Escala motora unificada de Parkinson.',
    disponible: false,
  },
];

export function ModulosAnalisis() {
  return (
    <div className="modulos-grid">
      {MODULOS.map((m) => {
        const Icon = m.icon;
        const card = (
          <>
            <div className="modulo-card-icon">
              <Icon size={18} strokeWidth={1.75} />
            </div>
            <div>
              <div className="modulo-card-title">{m.title}</div>
              <div className="modulo-card-desc">{m.desc}</div>
            </div>
            {!m.disponible && <span className="modulo-badge-soon">Próximamente</span>}
          </>
        );

        return (
          <Link key={m.title} href={m.href} className={`modulo-card ${m.disponible ? '' : 'disabled'}`}>
            {card}
          </Link>
        );
      })}
    </div>
  );
}
