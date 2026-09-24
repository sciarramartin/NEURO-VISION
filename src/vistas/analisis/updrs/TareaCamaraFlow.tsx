'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Camera, Check, RotateCcw, X, Info } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot } from 'recharts';
import { InstructivoAnimado } from '../InstructivoAnimado';
import { CapturaTimerRing } from '../CapturaTimerRing';
import { useCountdown7s } from '../useCountdown7s';
import { useUpdrsCapture } from './useUpdrsCapture';
import { TAREAS, ResultadoTarea } from './tareasCamara';
import { PuntajeSelector } from './PuntajeSelector';
import type { SubItemUpdrs, ItemUpdrs, TareaCamara, LadoUpdrs } from '@/biblioteca/math/updrs';
import type { Muestra, MetricasRepetitivas, MetricasTemblor } from '@/biblioteca/math/ritmoMotor';

/** Lo que se guarda de cada medición con cámara dentro de la evaluación. */
export interface MedicionGuardada {
  tarea: TareaCamara;
  lado: LadoUpdrs;
  fecha: string;
  simulada: boolean;
  puntajeSugerido: number;
  criterios: { rasgo: string; valor: string; puntaje: number | null }[];
  metricas: Record<string, number>;
  serie: { t: number; v: number }[];
}

interface Props {
  item: ItemUpdrs;
  sub: SubItemUpdrs;
  onConfirmar: (puntaje: number, medicion: MedicionGuardada) => void;
  onCancelar: () => void;
}

type Fase = 'instrucciones' | 'captura' | 'resultado';

function resumenMetricas(r: ResultadoTarea): Record<string, number> {
  if (r.tipo === 'repetitivo') {
    const m = r.metricas as MetricasRepetitivas;
    return {
      ciclos: m.ciclos, frecuencia_hz: +m.frecuencia.toFixed(2), amplitud_media: +m.amplitudMedia.toFixed(3),
      decremento_pct: +m.decremento.toFixed(1), interrupciones: m.interrupciones, irregularidad_pct: +m.irregularidad.toFixed(1),
      duracion_s: +m.duracion.toFixed(1),
    };
  }
  const m = r.metricas as MetricasTemblor;
  return { frecuencia_hz: m.frecuencia, amplitud_cm: +m.amplitudCm.toFixed(2), ritmicidad_pct: Math.round(m.potenciaRelativa * 100) };
}

export function TareaCamaraFlow({ item, sub, onConfirmar, onCancelar }: Props) {
  const tarea = TAREAS[sub.tarea!];
  const lado: LadoUpdrs = sub.lado ?? 'DERECHA';
  const ladoTxt = lado === 'DERECHA' ? 'derecha' : 'izquierda';

  const [fase, setFase] = useState<Fase>('instrucciones');
  const [isMockMode, setIsMockMode] = useState(false);
  const [resultado, setResultado] = useState<ResultadoTarea | null>(null);
  const [puntaje, setPuntaje] = useState<number | undefined>(undefined);
  const [intento, setIntento] = useState(0);

  /** Devuelve un mensaje de error si la captura no alcanza para analizar. */
  const onData = useCallback((muestras: Muestra[]): string | null => {
    const minimo = (tarea.duracionMs / 1000) * 8; // ≥ ~8 cuadros/s con el segmento detectado
    if (muestras.length < minimo) {
      return `No se detectó ${tarea.modelo === 'MANO' ? 'la mano' : 'el miembro inferior'} durante suficiente tiempo (${muestras.length} cuadros válidos). Revise encuadre e iluminación e intente de nuevo.`;
    }
    const r = tarea.analizar(muestras);
    setResultado(r);
    setPuntaje(r.sugerencia.puntaje);
    setFase('resultado');
    return null;
  }, [tarea]);

  const repetir = () => { setResultado(null); setPuntaje(undefined); setIntento(i => i + 1); setFase('captura'); };

  const confirmar = () => {
    if (!resultado || puntaje === undefined) return;
    onConfirmar(puntaje, {
      tarea: sub.tarea!, lado, fecha: new Date().toISOString(), simulada: isMockMode,
      puntajeSugerido: resultado.sugerencia.puntaje, criterios: resultado.sugerencia.criterios,
      metricas: resumenMetricas(resultado),
      serie: (resultado.metricas.serie ?? []).filter((_, i) => i % 2 === 0), // 15 Hz basta para revisar
    });
  };

  const titulo = `${item.numero} ${tarea.titulo} — ${ladoTxt}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: 11, padding: '6px 12px' }} onClick={onCancelar}>
        <X size={13} /> Volver al protocolo
      </button>

      {fase === 'instrucciones' && (
        <InstructivoAnimado titulo={`Antes de medir: ${titulo}`} pasos={tarea.pasos} escena={tarea.escena}
          textoBoton="Continuar a la cámara" onComenzar={() => setFase('captura')} />
      )}

      {fase === 'captura' && (
        <CapturaPanel key={intento} tarea={tarea} lado={lado} titulo={titulo}
          isMockMode={isMockMode} setIsMockMode={setIsMockMode} onData={onData} />
      )}

      {fase === 'resultado' && resultado && (
        <div className="card" style={{ gap: 20 }}>
          <div className="section-header">Resultado — {titulo}</div>

          <MetricasVista r={resultado} />
          <SenalVista r={resultado} />

          <div className="updrs-sugerencia">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span className="form-label">Puntaje sugerido</span>
              <span className="updrs-sugerencia-valor">{resultado.sugerencia.puntaje}</span>
            </div>
            <table className="updrs-criterios">
              <tbody>
                {resultado.sugerencia.criterios.map(c => (
                  <tr key={c.rasgo}><td>{c.rasgo}</td><td>{c.valor}</td><td>{c.puntaje ?? '—'}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="info-banner">
              <Info size={14} style={{ flexShrink: 0 }} />
              <span>Sugerencia orientativa con umbrales provisionales, no validados. Confirme o corrija según su observación clínica.{isMockMode ? ' Medición en modo simulador.' : ''}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Puntaje confirmado por el evaluador</label>
            <PuntajeSelector valor={puntaje} onCambiar={setPuntaje} sugerido={resultado.sugerencia.puntaje} />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <button type="button" onClick={repetir} className="btn btn-outline"><RotateCcw size={13} /> Repetir medición</button>
            <button type="button" onClick={confirmar} className="btn btn-primary" disabled={puntaje === undefined}>
              <Check size={14} /> Confirmar puntaje {puntaje ?? ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface PanelProps {
  tarea: (typeof TAREAS)[TareaCamara];
  lado: LadoUpdrs;
  titulo: string;
  isMockMode: boolean;
  setIsMockMode: React.Dispatch<React.SetStateAction<boolean>>;
  onData: (m: Muestra[]) => string | null;
}

/**
 * Paso de captura. Es un componente propio (se monta sólo en esta fase)
 * para que la cámara y el bucle de tracking arranquen con el <canvas> ya
 * montado y se liberen al pasar al resultado.
 */
function CapturaPanel({ tarea, lado, titulo, isMockMode, setIsMockMode, onData }: PanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const recibir = useCallback((m: Muestra[]) => setAviso(onData(m)), [onData]);
  const { videoRef, canvasRef, loading, errorMsg, detectado } = useUpdrsCapture({ tarea, lado, isRecording, isMockMode, onDataCollected: recibir });

  const countdown = useCountdown7s({
    duracionMs: tarea.duracionMs,
    onIniciar: () => { setAviso(null); setIsRecording(true); },
    onFinalizar: () => setIsRecording(false),
  });

  const reintentar = () => { setAviso(null); countdown.reiniciar(); };

  return (
    <div className="card" style={{ gap: 20 }}>
      <div className="section-header">Captura — {titulo}</div>

      <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: 11 }}
        disabled={countdown.fase === 'grabando'} onClick={() => { setIsMockMode(m => !m); countdown.reiniciar(); }}>
        {isMockMode ? 'Usando modo simulador' : 'Usando cámara real'}
      </button>

      <div className="updrs-video">
        <video ref={videoRef} className="absolute pointer-events-none opacity-0" style={{ top: -9999, left: -9999, width: 640, height: 480 }} playsInline muted />
        <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full object-cover" />
        {loading && <div className="updrs-video-overlay">Cargando modelo de {tarea.modelo === 'MANO' ? 'manos' : 'pose'}…</div>}
        {errorMsg && <div className="updrs-video-overlay" style={{ color: 'var(--danger)' }}>{errorMsg}</div>}
        {!loading && !errorMsg && (
          <span className={`updrs-deteccion ${detectado ? 'ok' : ''}`}>
            {detectado ? 'Segmento detectado' : 'Buscando…'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
        <CapturaTimerRing fase={countdown.fase} segundos={countdown.segundos} progreso={countdown.progreso} total={tarea.duracionMs / 1000} />
        {countdown.fase === 'lista' && (
          <button type="button" onClick={countdown.iniciar} className="btn btn-primary" style={{ padding: '10px 20px' }}
            disabled={loading || !!errorMsg}>
            <Camera size={14} /> Iniciar ({tarea.duracionMs / 1000}s)
          </button>
        )}
        {countdown.fase === 'grabando' && <span className="captura-fase-badge grabando">{tarea.consigna}</span>}
        {countdown.fase === 'finalizada' && !aviso && <span className="captura-fase-badge listo">Analizando…</span>}
        {countdown.fase === 'finalizada' && aviso && (
          <button type="button" className="btn btn-outline" onClick={reintentar}><RotateCcw size={13} /> Reintentar</button>
        )}
      </div>

      {aviso && <div className="warning-banner">{aviso}</div>}
    </div>
  );
}

function Stat({ label, valor, unidad, contexto }: { label: string; valor: string; unidad?: string; contexto?: string }) {
  return (
    <div className="stat-card">
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{valor}{unidad && <span className="unit">{unidad}</span>}</span>
      {contexto && <span className="stat-card-context">{contexto}</span>}
    </div>
  );
}

function MetricasVista({ r }: { r: ResultadoTarea }) {
  if (r.tipo === 'repetitivo') {
    const m = r.metricas as MetricasRepetitivas;
    return (
      <div className="responsive-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <Stat label="Ciclos" valor={String(m.ciclos)} contexto={`en ${m.duracion.toFixed(1)} s`} />
        <Stat label="Frecuencia" valor={m.frecuencia.toFixed(2)} unidad="Hz" />
        <Stat label="Decremento" valor={Math.round(m.decremento).toString()} unidad="%" contexto="Amplitud inicio → final" />
        <Stat label="Interrupciones" valor={String(m.interrupciones)} contexto={`Irregularidad ${Math.round(m.irregularidad)} %`} />
      </div>
    );
  }
  const m = r.metricas as MetricasTemblor;
  return (
    <div className="responsive-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      <Stat label="Amplitud (estimada)" valor={m.amplitudCm.toFixed(1)} unidad="cm" contexto="Pico a pico, eje principal" />
      <Stat label="Frecuencia dominante" valor={m.frecuencia.toFixed(1)} unidad="Hz" contexto="Banda 3–12 Hz" />
      <Stat label="Ritmicidad" valor={Math.round(m.potenciaRelativa * 100).toString()} unidad="%" contexto="Potencia en el pico ±0,5 Hz" />
    </div>
  );
}

function SenalVista({ r }: { r: ResultadoTarea }) {
  const serie = r.metricas.serie;
  const picos = useMemo(() => {
    if (r.tipo !== 'repetitivo') return [];
    const m = r.metricas as MetricasRepetitivas;
    return m.picos.map(p => serie.reduce((best, s) => (Math.abs(s.t - p.tPico) < Math.abs(best.t - p.tPico) ? s : best), serie[0]));
  }, [r, serie]);
  if (!serie.length) return null;
  const unidad = r.tipo === 'temblor' ? 'cm' : 'u.rel.';
  return (
    <div>
      <div className="form-label" style={{ marginBottom: 6 }}>
        {r.tipo === 'temblor' ? 'Desplazamiento filtrado (cm)' : 'Señal del movimiento · puntos = ciclos detectados'}
      </div>
      <div style={{ width: '100%', height: 160 }}>
        <ResponsiveContainer>
          <LineChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              tickFormatter={v => `${Math.round(v)}s`} stroke="var(--border-card)" />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} stroke="var(--border-card)" width={44}
              tickFormatter={v => (Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(1))} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-card)', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: 'var(--text-secondary)' }} itemStyle={{ color: 'var(--text-primary)' }}
              labelFormatter={v => `${Number(v).toFixed(2)} s`}
              formatter={(v) => [`${Number(v).toFixed(3)} ${unidad}`, 'Señal']} />
            <Line type="monotone" dataKey="v" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
            {picos.map((p, i) => <ReferenceDot key={i} x={p.t} y={p.v} r={4} fill="var(--accent)" stroke="var(--bg-card)" strokeWidth={2} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
