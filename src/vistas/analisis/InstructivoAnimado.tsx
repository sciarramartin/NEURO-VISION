'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

export interface PasoInstructivo {
  icon: LucideIcon;
  texto: React.ReactNode;
}

interface Props {
  titulo: string;
  pasos: PasoInstructivo[];
  escena?: React.ReactNode;
  textoBoton?: string;
  onComenzar: () => void;
}

/**
 * Pantalla instructiva breve y animada, mostrada antes de cada captura
 * guiada (longitud del paso, goniómetro, análisis facial). Cada línea del
 * instructivo aparece con una pequeña animación en cascada para que se lea
 * de forma fluida, como una guía paso a paso, en vez de un bloque de texto
 * estático.
 */
export function InstructivoAnimado({ titulo, pasos, escena, textoBoton = 'Comenzar', onComenzar }: Props) {
  return (
    <div className="card" style={{ maxWidth: 640, margin: '0 auto', gap: 20 }}>
      <div className="section-header">{titulo}</div>

      {escena && <div className="instructivo-escena">{escena}</div>}

      <div className="instructivo-pasos">
        {pasos.map((p, i) => {
          const Icon = p.icon;
          return (
            <div key={i} className="instructivo-paso" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="instructivo-paso-icon">
                <Icon size={14} strokeWidth={2} />
              </div>
              <div className="instructivo-paso-texto">{p.texto}</div>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={onComenzar} className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '10px 20px' }}>
        {textoBoton} <ArrowRight size={14} />
      </button>
    </div>
  );
}
