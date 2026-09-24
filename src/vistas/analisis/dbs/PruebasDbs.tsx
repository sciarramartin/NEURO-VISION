'use client';

import React, { useCallback, useState } from 'react';
import { Ruler, Armchair, Hand, Timer, Footprints, UserX, Check, RotateCcw, X } from 'lucide-react';
import { InstructivoAnimado } from '../InstructivoAnimado';
import { CapturaGuiada } from '../vision/CapturaGuiada';
import { visibles } from '../vision/useVisionCapture';
import { ExpresionFacialFlow } from '../facial/ExpresionFacialFlow';
import {
  MuestraSentado, ResultadoSentado, NODOS_SENTADO, DURACION_SENTADO_MS, extraerMuestraSentado, analizarSentado, simularMuestraSentado,
  MuestraMarcha, ResultadoMarcha, NODOS_MARCHA, DURACION_MARCHA_MS, extraerMuestraMarcha, analizarMarcha, simularMuestraMarcha,
  ETIQUETA_REGION, ETIQUETA_NIVEL, RegionMovimiento, RegionTemblor, UMBRAL_TEMBLOR_POSE_CM, UMBRAL_MOVIMIENTO_CM,
} from '@/biblioteca/math/programacionDbs';
import type { ResultadoExpresion } from '@/biblioteca/math/expresionFacial';

export type PruebaDbs = 'sentado' | 'marcha' | 'facial';

/* ---------------- Escenas ---------------- */

function EscenaSentado() {
  return (
    <svg viewBox="0 0 300 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <text x="150" y="16" textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="var(--font-mono)">1 metro · sentado, cuerpo completo · 15 s</text>
      <g transform="translate(150,30)" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" fill="none">
        <circle cx="0" cy="8" r="7" fill="var(--accent)" stroke="none" />
        <line x1="0" y1="15" x2="0" y2="48" />
        <line x1="0" y1="22" x2="-14" y2="40" /><line x1="-14" y1="40" x2="-12" y2="58" />
        <line x1="0" y1="22" x2="14" y2="40" /><line x1="14" y1="40" x2="12" y2="58" />
        <line x1="0" y1="48" x2="-12" y2="58" /><line x1="0" y1="48" x2="12" y2="58" />
        <line x1="-12" y1="58" x2="-12" y2="82" /><line x1="12" y1="58" x2="12" y2="82" />
        <circle cx="-12" cy="58" r="3" fill="var(--accent)" stroke="none">
          <animate attributeName="cx" values="-12;-10.5;-12;-13.5;-12" dur="0.2s" repeatCount="indefinite" />
        </circle>
        <line x1="-40" y1="84" x2="40" y2="84" stroke="var(--border-hover)" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function EscenaMarchaPerfil() {
  return (
    <svg viewBox="0 0 300 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <line x1="20" y1="95" x2="280" y2="95" stroke="var(--border-card)" strokeWidth="1" strokeDasharray="4 4" />
      <text x="150" y="18" textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="var(--font-mono)">2 metros · de perfil · cruzar el cuadro</text>
      <g className="nv-walk-figure">
        <g transform="translate(20,50)">
          <circle cx="0" cy="0" r="6" fill="var(--accent)" />
          <line x1="0" y1="6" x2="0" y2="28" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          <line className="nv-walk-leg-a" x1="0" y1="28" x2="-7" y2="45" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          <line className="nv-walk-leg-b" x1="0" y1="28" x2="7" y2="45" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

const PASOS_SENTADO = [
  { icon: Ruler, texto: <>Cámara <b>fija a 1 metro</b>, de frente, con el <b>cuerpo completo</b> en cuadro (cabeza a pies).</> },
  { icon: Armchair, texto: <>Paciente <b>sentado</b>, lo más <b>quieto posible</b>, con las <b>manos sobre las rodillas</b> y los pies apoyados.</> },
  { icon: Hand, texto: <>Manos y pies se analizan como <b>temblor</b>; cabeza, hombros, codos, caderas y rodillas como <b>movimiento involuntario</b> (discinesias).</> },
  { icon: Timer, texto: <>Registro de <b>15 segundos</b> entre dos tonos, sin hablar.</> },
];

const PASOS_MARCHA = [
  { icon: Ruler, texto: <>Cámara fija a <b>2 metros</b> del recorrido, de <b>perfil</b>, en horizontal.</> },
  { icon: UserX, texto: <>Cuerpo completo en cuadro y <b>sin acompañantes</b> en escena. Mismo calzado en todas las firmas.</> },
  { icon: Footprints, texto: <>Tras el tono, el paciente <b>cruza el cuadro</b> caminando a su ritmo habitual. Presione <b>Detener</b> al salir de cuadro (máx. 15 s).</> },
];

/* ---------------- Resultados ---------------- */

export function ResultadoSentadoVista({ r }: { r: ResultadoSentado }) {
  const temblor = Object.entries(r.temblor) as [RegionTemblor, NonNullable<ResultadoSentado['temblor'][RegionTemblor]>][];
  const mov = Object.entries(r.movimiento) as [RegionMovimiento, NonNullable<ResultadoSentado['movimiento'][RegionMovimiento]>][];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="responsive-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div className="stat-card"><span className="stat-card-label">Temblor máximo</span>
          <span className="stat-card-value">{r.temblorMaxCm.toFixed(1)}<span className="unit">cm</span></span>
          <span className="stat-card-context">Umbral de detección {UMBRAL_TEMBLOR_POSE_CM} cm</span></div>
        <div className="stat-card"><span className="stat-card-label">Índice de discinesias</span>
          <span className="stat-card-value">{r.indiceDiscinesias.toFixed(1)}<span className="unit">cm</span></span>
          <span className="stat-card-context">Suma de rangos sobre {UMBRAL_MOVIMIENTO_CM} cm</span></div>
        <div className="stat-card"><span className="stat-card-label">Regiones con movimiento</span>
          <span className="stat-card-value">{r.regionesConMovimiento}<span className="unit">/ {mov.length}</span></span>
          <span className="stat-card-context">{r.duracionS} s analizados</span></div>
      </div>
      <div className="responsive-split-2fr1fr" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <table className="updrs-historial">
          <thead><tr><th>Temblor</th><th className="num">Amplitud</th><th className="num">Frec.</th></tr></thead>
          <tbody>{temblor.map(([k, v]) => (
            <tr key={k}><td>{ETIQUETA_REGION[k]}</td>
              <td className="num">{v.presente ? `${v.amplitudCm.toFixed(1)} cm` : <span style={{ color: 'var(--text-muted)' }}>no</span>}</td>
              <td className="num">{v.presente ? `${v.frecuencia.toFixed(1)} Hz` : '—'}</td></tr>
          ))}</tbody>
        </table>
        <table className="updrs-historial">
          <thead><tr><th>Movimiento involuntario</th><th className="num">Rango</th><th className="num">Nivel</th></tr></thead>
          <tbody>{mov.map(([k, v]) => (
            <tr key={k}><td>{ETIQUETA_REGION[k]}</td><td className="num">{v.rangoCm.toFixed(1)} cm</td>
              <td className="num"><span className={`nivel-mov n${v.nivel}`}>{ETIQUETA_NIVEL[v.nivel]}</span></td></tr>
          ))}</tbody>
        </table>
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        Estimación en cm asumiendo 38 cm de ancho de hombros. Umbrales provisionales; útil para comparar firmas del mismo paciente.
      </span>
    </div>
  );
}

export function ResultadoMarchaVista({ r }: { r: ResultadoMarcha }) {
  return (
    <div className="responsive-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      <div className="stat-card"><span className="stat-card-label">Longitud media</span>
        <span className="stat-card-value">{r.longitudMediaCm.toFixed(0)}<span className="unit">cm</span></span>
        <span className="stat-card-context">{r.pasos} pasos · CV {r.variabilidad.toFixed(0)} %</span></div>
      <div className="stat-card"><span className="stat-card-label">Paso derecho</span>
        <span className="stat-card-value">{r.longitudDCm?.toFixed(0) ?? '—'}<span className="unit">cm</span></span></div>
      <div className="stat-card"><span className="stat-card-label">Paso izquierdo</span>
        <span className="stat-card-value">{r.longitudICm?.toFixed(0) ?? '—'}<span className="unit">cm</span></span></div>
      <div className="stat-card"><span className="stat-card-label">Cadencia</span>
        <span className="stat-card-value">{r.cadencia.toFixed(0)}<span className="unit">p/min</span></span>
        <span className="stat-card-context">Asimetría {r.asimetria === null ? '—' : `${Math.abs(r.asimetria).toFixed(0)} %`}</span></div>
    </div>
  );
}

/* ---------------- Flujo de una prueba ---------------- */

interface Props {
  prueba: PruebaDbs;
  tallaCm: number;
  titulo: string;
  onGuardar: (r: { sentado?: ResultadoSentado; marcha?: ResultadoMarcha; facial?: ResultadoExpresion }) => void;
  onCancelar: () => void;
}

export function PruebaDbsFlow({ prueba, tallaCm, titulo, onGuardar, onCancelar }: Props) {
  const [fase, setFase] = useState<'instrucciones' | 'captura' | 'resultado'>('instrucciones');
  const [isMockMode, setIsMockMode] = useState(false);
  const [intento, setIntento] = useState(0);
  const [sentado, setSentado] = useState<ResultadoSentado | null>(null);
  const [marcha, setMarcha] = useState<ResultadoMarcha | null>(null);

  const onSentado = useCallback((m: (MuestraSentado & { t: number })[]) => {
    const r = analizarSentado(m);
    if (!r) return 'No se detectó el cuerpo completo durante suficiente tiempo. Verifique el encuadre (cabeza a pies) e intente de nuevo.';
    setSentado(r); setFase('resultado'); return null;
  }, []);
  const onMarcha = useCallback((m: (MuestraMarcha & { t: number })[]) => {
    const r = analizarMarcha(m, tallaCm);
    if (!r) return 'No se detectaron pasos suficientes. Verifique que caderas y tobillos se vean durante el recorrido.';
    setMarcha(r); setFase('resultado'); return null;
  }, [tallaCm]);

  const repetir = () => { setSentado(null); setMarcha(null); setIntento(i => i + 1); setFase('captura'); };

  const acciones = (guardar: () => void) => (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
      <button type="button" onClick={repetir} className="btn btn-outline"><RotateCcw size={13} /> Repetir</button>
      <button type="button" onClick={guardar} className="btn btn-primary"><Check size={14} /> Guardar en la firma</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: 11, padding: '6px 12px' }} onClick={onCancelar}>
        <X size={13} /> Volver a la firma
      </button>

      {prueba === 'facial' ? (
        <ExpresionFacialFlow acciones={(r, rep) => (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <button type="button" onClick={rep} className="btn btn-outline"><RotateCcw size={13} /> Repetir</button>
            <button type="button" onClick={() => onGuardar({ facial: r })} className="btn btn-primary"><Check size={14} /> Guardar en la firma</button>
          </div>
        )} />
      ) : (
        <>
          {fase === 'instrucciones' && (
            <InstructivoAnimado
              titulo={`${titulo}: ${prueba === 'sentado' ? 'paciente sentado' : 'marcha'}`}
              pasos={prueba === 'sentado' ? PASOS_SENTADO : PASOS_MARCHA}
              escena={prueba === 'sentado' ? <EscenaSentado /> : <EscenaMarchaPerfil />}
              textoBoton="Continuar a la cámara" onComenzar={() => setFase('captura')} />
          )}
          {fase === 'captura' && prueba === 'sentado' && (
            <CapturaGuiada<MuestraSentado> key={intento} titulo={`${titulo} — sentado`} modelo="POSE"
              duracionMs={DURACION_SENTADO_MS} nodos={NODOS_SENTADO} consigna="Quieto, manos sobre las rodillas"
              extraer={(lm, raw) => extraerMuestraSentado(lm, idx => visibles(raw, idx))} simular={simularMuestraSentado}
              isMockMode={isMockMode} setIsMockMode={setIsMockMode} onData={onSentado}
              pie={<button type="button" className="btn btn-secondary" disabled style={{ alignSelf: 'flex-start' }} title="Próximamente">
                Sumar acelerómetro <span className="modulo-badge-soon" style={{ position: 'static', marginLeft: 6 }}>Próximamente</span>
              </button>} />
          )}
          {fase === 'captura' && prueba === 'marcha' && (
            <CapturaGuiada<MuestraMarcha> key={intento} titulo={`${titulo} — marcha`} modelo="POSE"
              duracionMs={DURACION_MARCHA_MS} nodos={NODOS_MARCHA} consigna="Cruzar el cuadro caminando" permitirDetener
              extraer={(lm, raw) => extraerMuestraMarcha(lm, idx => visibles(raw, idx))} simular={simularMuestraMarcha}
              isMockMode={isMockMode} setIsMockMode={setIsMockMode} onData={onMarcha} />
          )}
          {fase === 'resultado' && sentado && (
            <div className="card" style={{ gap: 18 }}>
              <div className="section-header">Resultado — {titulo} · sentado{isMockMode ? ' (simulador)' : ''}</div>
              <ResultadoSentadoVista r={sentado} />
              {acciones(() => onGuardar({ sentado }))}
            </div>
          )}
          {fase === 'resultado' && marcha && (
            <div className="card" style={{ gap: 18 }}>
              <div className="section-header">Resultado — {titulo} · marcha{isMockMode ? ' (simulador)' : ''}</div>
              <ResultadoMarchaVista r={marcha} />
              {acciones(() => onGuardar({ marcha }))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
