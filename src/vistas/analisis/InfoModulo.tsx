'use client';

import React, { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import { INFO_MODULOS, INSTRUCCIONES_ITEM, FUENTE_MDS, FUENTE_PROPIA, SeccionInfo } from '@/biblioteca/instruccionesEvaluador';

interface DialogoProps {
  titulo: string;
  resumen?: string;
  secciones: SeccionInfo[];
  onCerrar: () => void;
}

function DialogoInfo({ titulo, resumen, secciones, onCerrar }: DialogoProps) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onCerrar]);
  const usaMds = secciones.some(s => s.fuente === 'MDS');
  const usaPropia = secciones.some(s => s.fuente === 'PROPIA');
  return (
    <div className="info-overlay" onClick={onCerrar} role="presentation">
      <div className="info-dialogo" role="dialog" aria-modal="true" aria-label={titulo} onClick={e => e.stopPropagation()}>
        <div className="info-dialogo-cabecera">
          <div>
            <span className="form-label">Instrucciones al evaluador</span>
            <h2 style={{ fontSize: 18, marginTop: 2 }}>{titulo}</h2>
          </div>
          <button type="button" className="info-cerrar" onClick={onCerrar} aria-label="Cerrar"><X size={16} /></button>
        </div>
        {resumen && <p className="info-resumen">{resumen}</p>}
        {secciones.map(s => (
          <section key={s.titulo} className="info-seccion">
            <h3>{s.titulo} <span className={`info-fuente-tag ${s.fuente === 'MDS' ? 'mds' : ''}`}>{s.fuente === 'MDS' ? 'MDS-UPDRS' : 'NeuroVision'}</span></h3>
            <ul>{s.puntos.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </section>
        ))}
        <footer className="info-fuente">
          {usaMds && <p><b>Fuente MDS-UPDRS:</b> {FUENTE_MDS}</p>}
          {usaPropia && <p><b>NeuroVision:</b> {FUENTE_PROPIA}</p>}
        </footer>
      </div>
    </div>
  );
}

/** Botón "i" de la cabecera de cada módulo. */
export function InfoModulo({ modulo }: { modulo: keyof typeof INFO_MODULOS | string }) {
  const [abierto, setAbierto] = useState(false);
  const c = INFO_MODULOS[modulo];
  if (!c) return null;
  return (
    <>
      <button type="button" className="info-boton" onClick={() => setAbierto(true)} aria-label={`Información: ${c.titulo}`}>
        <Info size={15} /> Info
      </button>
      {abierto && <DialogoInfo titulo={c.titulo} resumen={c.resumen} secciones={c.secciones} onCerrar={() => setAbierto(false)} />}
    </>
  );
}

/** Botón "i" compacto de cada ítem de la UPDRS III. */
export function InfoItemUpdrs({ numero, nombre }: { numero: string; nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const puntos = INSTRUCCIONES_ITEM[numero];
  if (!puntos) return null;
  return (
    <>
      <button type="button" className="info-boton-icono" onClick={() => setAbierto(true)} aria-label={`Instrucciones ${numero}`}>
        <Info size={15} />
      </button>
      {abierto && (
        <DialogoInfo titulo={`${numero} ${nombre}`} secciones={[{ titulo: 'Cómo evaluar', fuente: 'MDS', puntos }]} onCerrar={() => setAbierto(false)} />
      )}
    </>
  );
}
