'use client';

import React, { useCallback, useState } from 'react';
import { Camera, ScanFace, Timer, Smile, RotateCcw } from 'lucide-react';
import { InstructivoAnimado } from '../InstructivoAnimado';
import { CapturaGuiada } from '../vision/CapturaGuiada';
import {
  MuestraFacial, ResultadoExpresion, Gesto, ETIQUETA_GESTO, DESCRIPCION_GESTO, NODOS_EXPRESION, FASES_EXPRESION,
  DURACION_EXPRESION_MS, extraerMuestraFacial, analizarExpresion, simularMuestraFacial,
} from '@/biblioteca/math/expresionFacial';

const PASOS = [
  { icon: Camera, texto: <>Cámara <b>fija</b> a unos <b>0,5 m</b>, rostro <b>de frente</b> y bien iluminado, sin anteojos ni pelo sobre la frente.</> },
  { icon: Timer, texto: <>La secuencia dura <b>15 segundos</b> y la pantalla indica cada gesto con un tono: <b>reposo → boca en pico → cejas arriba → sonrisa máxima</b>.</> },
  { icon: Smile, texto: <>En cada gesto pida la <b>contracción máxima</b> y sostenerla hasta el siguiente tono.</> },
  { icon: ScanFace, texto: <>Se miden distancias entre puntos de cada hemicara, normalizadas por la <b>distancia intercantal</b> (% DIC), para comparar PRE/POST y derecha/izquierda.</> },
];

function EscenaExpresion() {
  return (
    <svg viewBox="0 0 300 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <text x="150" y="16" textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="var(--font-mono)">reposo → pico → cejas → sonrisa · 15 s</text>
      <g transform="translate(150,68)" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round">
        <ellipse cx="0" cy="0" rx="34" ry="42" stroke="var(--border-hover)" strokeWidth="1.5" />
        <path d="M-20 -18 Q-12 -22 -4 -18">
          <animate attributeName="d" values="M-20 -18 Q-12 -22 -4 -18;M-20 -18 Q-12 -22 -4 -18;M-20 -26 Q-12 -32 -4 -26;M-20 -18 Q-12 -22 -4 -18" dur="4s" repeatCount="indefinite" />
        </path>
        <path d="M4 -18 Q12 -22 20 -18">
          <animate attributeName="d" values="M4 -18 Q12 -22 20 -18;M4 -18 Q12 -22 20 -18;M4 -26 Q12 -32 20 -26;M4 -18 Q12 -22 20 -18" dur="4s" repeatCount="indefinite" />
        </path>
        <path d="M-14 18 Q0 22 14 18">
          <animate attributeName="d" values="M-14 18 Q0 22 14 18;M-6 18 Q0 14 6 18;M-14 18 Q0 22 14 18;M-18 14 Q0 30 18 14" dur="4s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  );
}

export function ResultadoExpresionVista({ r }: { r: ResultadoExpresion }) {
  const gestos = Object.keys(r.gestos) as Gesto[];
  const max = Math.max(1, ...gestos.flatMap(g => [r.gestos[g].derecha, r.gestos[g].izquierda]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="responsive-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <div className="stat-card">
          <span className="stat-card-label">Índice de expresión global</span>
          <span className="stat-card-value">{r.indiceGlobal.toFixed(1)}<span className="unit">% DIC</span></span>
          <span className="stat-card-context">Excursión media de ambos lados en los 3 gestos</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Asimetría media</span>
          <span className="stat-card-value">{r.asimetriaGlobal.toFixed(0)}<span className="unit">%</span></span>
          <span className="stat-card-context">|D − I| / máx(D, I)</span>
        </div>
      </div>
      <table className="updrs-historial">
        <thead><tr><th>Gesto</th><th>Hemicara derecha</th><th>Hemicara izquierda</th><th style={{ textAlign: 'right' }}>Asimetría</th></tr></thead>
        <tbody>
          {gestos.map(g => {
            const x = r.gestos[g];
            const menor = x.asimetria > 5 ? 'I' : x.asimetria < -5 ? 'D' : null;
            return (
              <tr key={g}>
                <td><div style={{ fontWeight: 600 }}>{ETIQUETA_GESTO[g]}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{DESCRIPCION_GESTO[g]}</div></td>
                {[x.derecha, x.izquierda].map((v, i) => (
                  <td key={i} style={{ minWidth: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="updrs-progreso" style={{ maxWidth: 90 }}><div style={{ width: `${(v / max) * 100}%` }} /></div>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v.toFixed(1)}</span>
                    </div>
                  </td>
                ))}
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {Math.abs(x.asimetria).toFixed(0)} %{menor ? ` · menor ${menor}` : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        Valores en % de la distancia intercantal externa (DIC). Lateralidad del paciente.
      </span>
    </div>
  );
}

interface Props {
  /** Se llama al obtener un resultado válido. */
  onResultado?: (r: ResultadoExpresion) => void;
  /** Acciones bajo el resultado (guardar, volver…). */
  acciones?: (r: ResultadoExpresion, repetir: () => void) => React.ReactNode;
  saltarInstructivo?: boolean;
}

/** Flujo completo: instructivo → captura secuencial de 15 s → resultado. */
export function ExpresionFacialFlow({ onResultado, acciones, saltarInstructivo = false }: Props) {
  const [fase, setFase] = useState<'instrucciones' | 'captura' | 'resultado'>(saltarInstructivo ? 'captura' : 'instrucciones');
  const [isMockMode, setIsMockMode] = useState(false);
  const [resultado, setResultado] = useState<ResultadoExpresion | null>(null);
  const [intento, setIntento] = useState(0);

  const onData = useCallback((m: (MuestraFacial & { t: number })[]) => {
    const r = analizarExpresion(m);
    if (!r) return 'No se detectó el rostro durante suficiente tiempo en alguno de los gestos. Revise encuadre e iluminación e intente de nuevo.';
    setResultado(r);
    onResultado?.(r);
    setFase('resultado');
    return null;
  }, [onResultado]);

  const repetir = () => { setResultado(null); setIntento(i => i + 1); setFase('captura'); };

  return (
    <>
      {fase === 'instrucciones' && (
        <InstructivoAnimado titulo="Antes de medir: expresión facial máxima" pasos={PASOS} escena={<EscenaExpresion />}
          textoBoton="Continuar a la cámara" onComenzar={() => setFase('captura')} />
      )}
      {fase === 'captura' && (
        <CapturaGuiada<MuestraFacial> key={intento} titulo="Expresión facial máxima" modelo="CARA"
          duracionMs={DURACION_EXPRESION_MS} nodos={NODOS_EXPRESION}
          fases={FASES_EXPRESION.map(f => ({ hastaS: f.hastaS, texto: f.texto }))}
          extraer={lm => extraerMuestraFacial(lm)} simular={simularMuestraFacial}
          isMockMode={isMockMode} setIsMockMode={setIsMockMode} onData={onData} />
      )}
      {fase === 'resultado' && resultado && (
        <div className="card" style={{ gap: 20 }}>
          <div className="section-header">Resultado — expresión facial máxima{isMockMode ? ' (simulador)' : ''}</div>
          <ResultadoExpresionVista r={resultado} />
          {acciones ? acciones(resultado, repetir) : (
            <button type="button" onClick={repetir} className="btn btn-outline" style={{ alignSelf: 'flex-start' }}>
              <RotateCcw size={13} /> Repetir
            </button>
          )}
        </div>
      )}
    </>
  );
}
