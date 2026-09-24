'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Camera, ChevronRight, ClipboardList, Info, Save, CheckCircle2, AlertTriangle, RotateCcw,
  X, Plus, Copy, Check, FileText, FileSpreadsheet, RefreshCw, FlaskConical,
} from 'lucide-react';
import { useCaptureData } from '@/vistas/hooks/useCaptureData';
import {
  ITEMS_UPDRS3, Puntajes, resumirPuntajes, ETIQUETAS_GRUPO, HOEHN_YAHR, ContextoUpdrs, CONTEXTO_INICIAL, GrupoUpdrs,
  ItemUpdrs, SubItemUpdrs, Toma, tomasIniciales, nuevaToma, MINUTOS_ON, itemsIncluidos, respuestaLevodopa,
  UMBRAL_RESPUESTA_LEVODOPA,
} from '@/biblioteca/math/updrs';
import { generarNarrativa, PreviaUpdrs } from '@/biblioteca/informeUpdrs';
import { exportarUpdrsPDF, exportarUpdrsExcel } from '@/biblioteca/exportsUpdrs';
import { PuntajeSelector } from './PuntajeSelector';
import { TareaCamaraFlow, MedicionGuardada } from './TareaCamaraFlow';
import { InfoModulo, InfoItemUpdrs } from '../InfoModulo';

type Fase = 'contexto' | 'protocolo' | 'resumen';
type TomaU = Toma<MedicionGuardada>;

interface EvaluacionPrevia {
  id: string;
  modo: string;
  puntaje_total: number | null;
  created_at: string;
  datos: {
    version?: number;
    contexto?: Partial<ContextoUpdrs>;
    completo?: boolean;
    respuesta?: { mejoria: number | null; mejorOn?: string | null } | null;
  };
}

const CLAVE_BORRADOR = 'nv-updrs3-borrador-v2';

interface Borrador {
  version: 2;
  contexto: ContextoUpdrs;
  modo: string;
  minutosOn: number[];
  tomas: TomaU[];
  tomaActiva: string;
  observaciones: string;
  narrativa: string | null;
}

function leerBorrador(): Partial<Borrador> {
  try {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(CLAVE_BORRADOR) : null;
    const b = raw ? JSON.parse(raw) : {};
    return b.version === 2 ? b : {};
  } catch {
    return {};
  }
}

const MED = { ON: 'ON', OFF: 'OFF', SIN_MEDICACION: 'sin medicación' } as const;
const DBS = { ON: 'DBS ON', OFF: 'DBS OFF', NO_APLICA: '' } as const;

/** Etiqueta sin el lado: "MS derecho" → "MS", "Derecha" → "". */
const segmento = (e: string) => e.replace(/\b(derech|izquierd)[oa]\b/i, '').trim().toLowerCase();

/** Conserva lo ya puntuado en las tomas que siguen existiendo tras cambiar la configuración. */
function fusionarTomas(nuevas: TomaU[], viejas: TomaU[]): TomaU[] {
  return nuevas.map(n => viejas.find(v => v.id === n.id) ?? n);
}

/**
 * Módulo 7 — UPDRS III asistida.
 *
 * Flujo: contexto (paciente, evaluación única o test de levodopa, versión
 * completa o personalizada) → protocolo ítem por ítem, una pestaña por
 * toma (OFF basal, ON 30/60/90 min) → resumen con respuesta a levodopa,
 * informe narrativo copiable, PDF/Excel y guardado. El borrador se conserva
 * en la pestaña (sessionStorage) para no perder un examen a medias.
 */
export function UpdrsView() {
  // Sólo cliente (ver page.tsx): el borrador puede leerse en el inicializador.
  const [borrador] = useState<Partial<Borrador>>(leerBorrador);
  const [fase, setFase] = useState<Fase>('contexto');
  const [contexto, setContexto] = useState<ContextoUpdrs>({ ...CONTEXTO_INICIAL, ...borrador.contexto });
  const [modo, setModo] = useState(borrador.modo ?? 'PRE');
  const [minutosOn, setMinutosOn] = useState<number[]>(borrador.minutosOn ?? [30, 60, 90]);
  const [tomas, setTomas] = useState<TomaU[]>(borrador.tomas ?? []);
  const [tomaActiva, setTomaActiva] = useState(borrador.tomaActiva ?? '');
  const [observaciones, setObservaciones] = useState(borrador.observaciones ?? '');
  const [narrativa, setNarrativa] = useState<string | null>(borrador.narrativa ?? null);
  const [activo, setActivo] = useState<{ item: ItemUpdrs; sub: SubItemUpdrs; saltar: boolean; sim: boolean } | null>(null);

  const { patients, selectedPatientId, setSelectedPatientId } = useCaptureData();

  useEffect(() => {
    try {
      const b: Borrador = { version: 2, contexto, modo, minutosOn, tomas, tomaActiva, observaciones, narrativa };
      sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(b));
    } catch { /* noop */ }
  }, [contexto, modo, minutosOn, tomas, tomaActiva, observaciones, narrativa]);

  const toma = tomas.find(t => t.id === tomaActiva) ?? tomas[0];

  const actualizarToma = useCallback((id: string, f: (t: TomaU) => TomaU) => {
    setTomas(ts => ts.map(t => (t.id === id ? f(t) : t)));
  }, []);

  const setPuntaje = useCallback((id: string, v: number | undefined) => {
    if (!toma) return;
    actualizarToma(toma.id, t => ({ ...t, puntajes: { ...t.puntajes, [id]: v } }));
  }, [toma, actualizarToma]);

  const comenzar = () => {
    const nuevas = fusionarTomas(tomasIniciales<MedicionGuardada>(contexto, minutosOn), tomas);
    setTomas(nuevas);
    if (!nuevas.some(t => t.id === tomaActiva)) setTomaActiva(nuevas[0].id);
    setFase('protocolo');
    window.scrollTo({ top: 0 });
  };

  const agregarToma = () => {
    const usados = tomas.filter(t => t.estado === 'ON').map(t => t.minutos ?? 0);
    const m = Math.max(0, ...usados) + 30;
    const t = nuevaToma<MedicionGuardada>(`ON${m}`, `ON ${m} min`, 'ON', m);
    setTomas(ts => [...ts, t]);
    setMinutosOn(ms => [...ms, m]);
    setTomaActiva(t.id);
  };

  const nuevaEvaluacion = () => {
    setTomas([]); setObservaciones(''); setNarrativa(null); setContexto(CONTEXTO_INICIAL); setModo('PRE'); setMinutosOn([30, 60, 90]);
    try { sessionStorage.removeItem(CLAVE_BORRADOR); } catch { /* noop */ }
    setFase('contexto');
  };

  const irA = (f: Fase) => { if (f !== 'contexto' && !tomas.length && f !== fase) { comenzar(); return; } setFase(f); window.scrollTo({ top: 0 }); };

  /** Homólogo del otro lado con tarea de cámara (p. ej. 3.4-D → 3.4-I). */
  const contralateralDe = (item: ItemUpdrs, sub: SubItemUpdrs) =>
    item.subitems.find(s => s.id !== sub.id && s.tarea === sub.tarea && s.lado && s.lado !== sub.lado && segmento(s.etiqueta) === segmento(sub.etiqueta)) ?? null;

  return (
    <div className="main-content">
      <Link href="/" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: 11, padding: '6px 12px' }}>
        <ArrowLeft size={13} /> Volver al inicio
      </Link>

      <div className="modulo-cabecera">
        <div>
          <h1 style={{ fontSize: 20 }}>UPDRS III</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Examen motor ítem por ítem, con medición asistida por cámara.</p>
        </div>
        <InfoModulo modulo="updrs" />
      </div>

      {activo && toma ? (
        <TareaCamaraFlow
          key={activo.sub.id + toma.id}
          item={activo.item}
          sub={activo.sub}
          saltarInstructivo={activo.saltar}
          simuladorInicial={activo.sim}
          contralateral={(() => { const c = contralateralDe(activo.item, activo.sub); return c && toma.puntajes[c.id] === undefined ? c : null; })()}
          onCancelar={() => setActivo(null)}
          onConfirmar={(p, med, siguiente) => {
            actualizarToma(toma.id, t => ({ ...t, puntajes: { ...t.puntajes, [activo.sub.id]: p }, mediciones: { ...t.mediciones, [activo.sub.id]: med } }));
            const c = siguiente ? contralateralDe(activo.item, activo.sub) : null;
            setActivo(c ? { item: activo.item, sub: c, saltar: true, sim: med.simulada } : null);
            window.scrollTo({ top: 0 });
          }}
        />
      ) : (
        <>
          <Pasos fase={fase} onIr={irA} />

          {fase === 'contexto' && (
            <ContextoCard
              contexto={contexto} setContexto={setContexto} modo={modo} setModo={setModo}
              minutosOn={minutosOn} setMinutosOn={setMinutosOn}
              patients={patients} selectedPatientId={selectedPatientId} setSelectedPatientId={setSelectedPatientId}
              onContinuar={comenzar} yaIniciado={tomas.length > 0}
            />
          )}

          {fase === 'protocolo' && toma && (
            <>
              {tomas.length > 1 && (
                <TabsTomas tomas={tomas} activa={toma.id} onElegir={setTomaActiva} excluidos={contexto.itemsExcluidos}
                  onAgregar={contexto.modalidad === 'LEVODOPA' ? agregarToma : undefined} />
              )}
              <BarraProgreso toma={toma} excluidos={contexto.itemsExcluidos} onResumen={() => irA('resumen')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {itemsIncluidos(contexto.itemsExcluidos).map(item => (
                  <ItemCard key={item.numero} item={item} puntajes={toma.puntajes} mediciones={toma.mediciones}
                    onPuntaje={setPuntaje} onMedir={sub => { setActivo({ item, sub, saltar: false, sim: false }); window.scrollTo({ top: 0 }); }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {(() => {
                  const i = tomas.findIndex(t => t.id === toma.id);
                  const sig = tomas[i + 1];
                  return sig ? (
                    <button type="button" className="btn btn-secondary" onClick={() => { setTomaActiva(sig.id); window.scrollTo({ top: 0 }); }}>
                      Siguiente toma: {sig.etiqueta} <ChevronRight size={14} />
                    </button>
                  ) : null;
                })()}
                <button type="button" className="btn btn-primary" onClick={() => irA('resumen')}>
                  Ver resumen <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}

          {fase === 'resumen' && tomas.length > 0 && (
            <ResumenCard
              contexto={contexto} modo={modo} tomas={tomas} actualizarToma={actualizarToma}
              observaciones={observaciones} setObservaciones={setObservaciones}
              narrativa={narrativa} setNarrativa={setNarrativa}
              patientId={selectedPatientId} patientName={patients.find(p => p.id === selectedPatientId)?.name ?? ''}
              onVolver={() => irA('protocolo')} onNueva={nuevaEvaluacion}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Pasos({ fase, onIr }: { fase: Fase; onIr: (f: Fase) => void }) {
  const pasos: { f: Fase; t: string }[] = [
    { f: 'contexto', t: 'Contexto' }, { f: 'protocolo', t: 'Protocolo' }, { f: 'resumen', t: 'Resumen' },
  ];
  const idx = pasos.findIndex(p => p.f === fase);
  return (
    <div className="updrs-pasos">
      {pasos.map((p, i) => (
        <button key={p.f} type="button" onClick={() => onIr(p.f)} className={`updrs-paso ${i === idx ? 'active' : ''} ${i < idx ? 'done' : ''}`}>
          <span className="num">{i + 1}</span> {p.t}
        </button>
      ))}
    </div>
  );
}

function Segmentado<T extends string>({ opciones, valor, onCambiar }: { opciones: { v: T; t: string }[]; valor: T; onCambiar: (v: T) => void }) {
  return (
    <div className="segmented-control">
      {opciones.map(o => (
        <button key={o.v} type="button" className={`segmented-option ${valor === o.v ? 'active' : ''}`} onClick={() => onCambiar(o.v)}>{o.t}</button>
      ))}
    </div>
  );
}

const numOrNull = (v: string) => (v === '' ? null : Math.max(0, Number(v)));

interface ContextoProps {
  contexto: ContextoUpdrs;
  setContexto: React.Dispatch<React.SetStateAction<ContextoUpdrs>>;
  modo: string;
  setModo: (m: string) => void;
  minutosOn: number[];
  setMinutosOn: React.Dispatch<React.SetStateAction<number[]>>;
  patients: { id: string; name: string }[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  onContinuar: () => void;
  yaIniciado: boolean;
}

function ContextoCard(props: ContextoProps) {
  const { contexto, setContexto, modo, setModo, minutosOn, setMinutosOn, patients, selectedPatientId, setSelectedPatientId, onContinuar, yaIniciado } = props;
  const personalizada = contexto.itemsExcluidos.length > 0;
  const [verSelector, setVerSelector] = useState(personalizada);
  const esTest = contexto.modalidad === 'LEVODOPA';
  const incluidos = itemsIncluidos(contexto.itemsExcluidos);

  const toggleItem = (n: string) => setContexto(c => {
    const ex = c.itemsExcluidos.includes(n) ? c.itemsExcluidos.filter(x => x !== n) : [...c.itemsExcluidos, n];
    return ex.length >= ITEMS_UPDRS3.length ? c : { ...c, itemsExcluidos: ex }; // al menos un ítem
  });

  return (
    <div className="card" style={{ maxWidth: 720, width: '100%', margin: '0 auto', gap: 18 }}>
      <div className="section-header"><ClipboardList size={16} className="icon" /> Contexto de la evaluación</div>

      <div className="responsive-form-2fr1fr" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Paciente</label>
          <select className="select-input" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Estado (PRE/POST cirugía o tratamiento)</label>
          <div className="segmented-control">
            <button type="button" className={`segmented-option ${modo === 'PRE' ? 'active-warning' : ''}`} onClick={() => setModo('PRE')}>PRE</button>
            <button type="button" className={`segmented-option ${modo === 'POST' ? 'active' : ''}`} onClick={() => setModo('POST')}>POST</button>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Modalidad</label>
        <Segmentado valor={contexto.modalidad} onCambiar={v => setContexto(c => ({ ...c, modalidad: v }))}
          opciones={[{ v: 'UNICA', t: 'Evaluación única' }, { v: 'LEVODOPA', t: 'Test de levodopa' }]} />
      </div>

      {esTest ? (
        <div className="updrs-test-config">
          <div className="responsive-form-2fr1fr" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Horas de lavado</label>
              <input className="input-text" type="number" min={0} inputMode="numeric" value={contexto.horasLavado ?? ''}
                onChange={e => setContexto(c => ({ ...c, horasLavado: numOrNull(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Dosis de prueba de levodopa (mg)</label>
              <input className="input-text" type="number" min={0} inputMode="numeric" placeholder="—" value={contexto.dosisPruebaMg ?? ''}
                onChange={e => setContexto(c => ({ ...c, dosisPruebaMg: numOrNull(e.target.value) }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tomas</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="chip chip-accent">OFF basal</span>
              {MINUTOS_ON.map(m => {
                const on = minutosOn.includes(m);
                return (
                  <button key={m} type="button" className={`updrs-toma-chip ${on ? 'active' : ''}`}
                    onClick={() => setMinutosOn(ms => (on ? ms.filter(x => x !== m) : [...ms, m].sort((a, b) => a - b)))}>
                    {on ? <Check size={12} /> : <Plus size={12} />} ON {m} min
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="responsive-form-2fr1fr" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Medicación</label>
            <Segmentado valor={contexto.medicacion} onCambiar={v => setContexto(c => ({ ...c, medicacion: v }))}
              opciones={[{ v: 'OFF', t: 'OFF' }, { v: 'ON', t: 'ON' }, { v: 'SIN_MEDICACION', t: 'Sin' }]} />
          </div>
          <div className="form-group">
            <label className="form-label">Minutos desde la última dosis de levodopa</label>
            <input className="input-text" type="number" min={0} inputMode="numeric" placeholder="—"
              disabled={contexto.medicacion === 'SIN_MEDICACION'} value={contexto.minutosUltimaDosis ?? ''}
              onChange={e => setContexto(c => ({ ...c, minutosUltimaDosis: numOrNull(e.target.value) }))} />
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Estimulación cerebral profunda</label>
        <Segmentado valor={contexto.estimulacion} onCambiar={v => setContexto(c => ({ ...c, estimulacion: v }))}
          opciones={[{ v: 'NO_APLICA', t: 'No aplica' }, { v: 'OFF', t: 'OFF' }, { v: 'ON', t: 'ON' }]} />
      </div>

      <div className="form-group">
        <label className="form-label">Versión</label>
        <Segmentado<'C' | 'P'> valor={verSelector ? 'P' : 'C'}
          onCambiar={v => { setVerSelector(v === 'P'); if (v === 'C') setContexto(c => ({ ...c, itemsExcluidos: [] })); }}
          opciones={[{ v: 'C', t: 'Completa (18 ítems)' }, { v: 'P', t: 'Personalizada' }]} />
      </div>

      {verSelector && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Toque la cruz para quitar un dominio. Quedan {incluidos.length} ítems · máximo {incluidos.reduce((s, i) => s + i.subitems.length * 4, 0)} puntos.
          </span>
          <div className="updrs-dominios">
            {ITEMS_UPDRS3.map(i => {
              const fuera = contexto.itemsExcluidos.includes(i.numero);
              return (
                <button key={i.numero} type="button" className={`updrs-dominio ${fuera ? 'fuera' : ''}`} onClick={() => toggleItem(i.numero)}
                  aria-pressed={!fuera} title={fuera ? 'Volver a incluir' : 'Quitar'}>
                  <span className="updrs-dominio-num">{i.numero}</span>
                  <span className="updrs-dominio-nombre">{i.nombre}</span>
                  <span className="updrs-dominio-x">{fuera ? <Plus size={13} /> : <X size={13} />}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="info-banner">
        <Info size={14} style={{ flexShrink: 0 }} />
        <span>
          Estructura basada en la Parte III de la MDS-UPDRS. Las ayudas de pantalla son resúmenes propios, no el texto oficial:
          el evaluador debe estar entrenado en la escala de la International Parkinson and Movement Disorder Society.
        </span>
      </div>

      <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={onContinuar} disabled={!selectedPatientId}>
        {yaIniciado ? 'Continuar protocolo' : 'Comenzar protocolo'} <ChevronRight size={14} />
      </button>
    </div>
  );
}

function TabsTomas({ tomas, activa, onElegir, excluidos, onAgregar }: { tomas: TomaU[]; activa: string; onElegir: (id: string) => void; excluidos: string[]; onAgregar?: () => void }) {
  return (
    <div className="updrs-tabs" role="tablist">
      {tomas.map(t => {
        const r = resumirPuntajes(t.puntajes, excluidos);
        return (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === activa} className={`updrs-tab ${t.id === activa ? 'active' : ''}`} onClick={() => onElegir(t.id)}>
            <span className={`updrs-tab-estado ${t.estado === 'ON' ? 'on' : ''}`}>{t.estado}</span>
            <span>{t.minutos ? `${t.minutos} min` : t.estado === 'OFF' ? 'basal' : ''}</span>
            <span className="updrs-tab-total">{r.completos ? r.total : '—'}</span>
            {r.completos === r.esperados && <CheckCircle2 size={13} style={{ color: 'var(--accent)' }} />}
          </button>
        );
      })}
      {onAgregar && (
        <button type="button" className="updrs-tab" onClick={onAgregar} aria-label="Agregar toma ON"><Plus size={14} /> Toma</button>
      )}
    </div>
  );
}

function BarraProgreso({ toma, excluidos, onResumen }: { toma: TomaU; excluidos: string[]; onResumen: () => void }) {
  const r = resumirPuntajes(toma.puntajes, excluidos);
  return (
    <div className="updrs-barra">
      <div className="updrs-barra-dato">
        <span className="form-label">{toma.etiqueta} · total parcial</span>
        <span className="updrs-barra-valor">{r.total}<span className="unit"> / {r.maximo}</span></span>
      </div>
      <div className="updrs-barra-dato" style={{ flex: 1, minWidth: 140 }}>
        <span className="form-label">Puntuados {r.completos} / {r.esperados}</span>
        <div className="updrs-progreso"><div style={{ width: `${(r.completos / Math.max(1, r.esperados)) * 100}%` }} /></div>
      </div>
      <button type="button" className="btn btn-secondary" onClick={onResumen}>Resumen <ArrowRight size={13} /></button>
    </div>
  );
}

interface ItemProps {
  item: ItemUpdrs;
  puntajes: Puntajes;
  mediciones: Record<string, MedicionGuardada>;
  onPuntaje: (id: string, v: number | undefined) => void;
  onMedir: (sub: SubItemUpdrs) => void;
}

function ItemCard({ item, puntajes, mediciones, onPuntaje, onMedir }: ItemProps) {
  const completo = item.subitems.every(s => puntajes[s.id] !== undefined);
  return (
    <div className={`updrs-item ${completo ? 'completo' : ''}`}>
      <div className="updrs-item-cabecera">
        <span className="updrs-item-num">{item.numero}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="updrs-item-nombre">{item.nombre}</div>
          <div className="updrs-item-ayuda">{item.ayuda}</div>
        </div>
        <InfoItemUpdrs numero={item.numero} nombre={item.nombre} />
        {completo && <CheckCircle2 size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />}
      </div>
      <div className="updrs-subitems">
        {item.subitems.map(sub => {
          const med = mediciones[sub.id];
          return (
            <div key={sub.id} className="updrs-subitem">
              {sub.etiqueta && <span className="updrs-subitem-etiqueta">{sub.etiqueta}</span>}
              <PuntajeSelector compacto valor={puntajes[sub.id]} onCambiar={v => onPuntaje(sub.id, v)}
                sugerido={med?.puntajeSugerido} etiqueta={`${item.numero} ${item.nombre} ${sub.etiqueta}`} />
              {sub.tarea && (
                <button type="button" className="btn btn-outline updrs-medir" onClick={() => onMedir(sub)}>
                  <Camera size={13} /> {med ? 'Remedir' : 'Medir'}
                </button>
              )}
              {med && (
                <span className="chip" title={med.criterios.map(c => `${c.rasgo}: ${c.valor}`).join(' · ')}>
                  Cámara: {med.puntajeSugerido}{med.simulada ? ' (sim.)' : ''}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface ResumenProps {
  contexto: ContextoUpdrs;
  modo: string;
  tomas: TomaU[];
  actualizarToma: (id: string, f: (t: TomaU) => TomaU) => void;
  observaciones: string;
  setObservaciones: (s: string) => void;
  narrativa: string | null;
  setNarrativa: (s: string | null) => void;
  patientId: string;
  patientName: string;
  onVolver: () => void;
  onNueva: () => void;
}

/** Sí / No / sin dato. "Sin dato" se muestra neutro, no como una respuesta. */
function SiNo({ valor, onCambiar }: { valor: boolean | null; onCambiar: (v: boolean | null) => void }) {
  const ops: { v: boolean | null; t: string }[] = [{ v: null, t: '—' }, { v: false, t: 'No' }, { v: true, t: 'Sí' }];
  return (
    <div className="segmented-control">
      {ops.map(o => (
        <button key={String(o.v)} type="button" onClick={() => onCambiar(o.v)}
          className={`segmented-option ${valor === o.v ? (o.v === null ? 'active-neutral' : o.v ? 'active-warning' : 'active') : ''}`}>{o.t}</button>
      ))}
    </div>
  );
}

function ResumenCard(props: ResumenProps) {
  const { contexto, modo, tomas, actualizarToma, observaciones, setObservaciones, narrativa, setNarrativa, patientId, patientName, onVolver, onNueva } = props;
  const excl = contexto.itemsExcluidos;
  const [estado, setEstado] = useState<'idle' | 'guardando' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previas, setPrevias] = useState<EvaluacionPrevia[]>([]);
  const [recarga, setRecarga] = useState(0);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    let vigente = true;
    fetch(`/api/evaluaciones?patientId=${encodeURIComponent(patientId)}&tipo=UPDRS_III`)
      .then(r => (r.ok ? r.json() : []))
      .then((rows: EvaluacionPrevia[]) => { if (vigente) setPrevias(rows); })
      .catch(() => { /* sin conexión: se omite el historial */ });
    return () => { vigente = false; };
  }, [patientId, recarga]);

  const esTest = contexto.modalidad === 'LEVODOPA';
  const resumenes = useMemo(() => tomas.map(t => ({ t, r: resumirPuntajes(t.puntajes, excl) })), [tomas, excl]);
  const resp = useMemo(() => (esTest ? respuestaLevodopa(tomas, excl) : null), [esTest, tomas, excl]);
  const principal = resumenes[0].r;
  const completo = resumenes.every(x => x.r.completos === x.r.esperados);

  const ultimaPre = useMemo(() => [...previas].reverse().find(p => p.modo === 'PRE' && p.puntaje_total !== null), [previas]);
  const previaPre: PreviaUpdrs | null = useMemo(() => (ultimaPre
    ? { fecha: new Date(ultimaPre.created_at).toLocaleDateString('es-AR'), total: ultimaPre.puntaje_total! } : null), [ultimaPre]);

  const narrativaAuto = useMemo(() => generarNarrativa(contexto, tomas, previaPre, modo), [contexto, tomas, previaPre, modo]);
  const texto = narrativa ?? narrativaAuto;
  const editada = narrativa !== null && narrativa !== narrativaAuto;

  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch { /* sin permiso */ }
  };

  const datosInforme = () => ({ paciente: patientName, fecha: new Date(), contexto, tomas, narrativa: texto, observaciones });

  const guardar = async () => {
    setEstado('guardando'); setError(null);
    try {
      const r = await fetch('/api/evaluaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          tipo: 'UPDRS_III',
          modo,
          puntaje_total: principal.total,
          datos: {
            version: 2,
            escala: 'MDS-UPDRS-III',
            completo,
            contexto,
            tomas,
            resumenes: resumenes.map(x => ({ id: x.t.id, etiqueta: x.t.etiqueta, ...x.r })),
            respuesta: resp ? { mejoria: resp.mejoria, mejorOn: resp.mejorOn?.etiqueta ?? null, porGrupo: resp.porGrupo } : null,
            narrativa: texto,
            observaciones,
          },
        }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`);
      setEstado('ok');
      setRecarga(n => n + 1);
    } catch (e) {
      setEstado('error');
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const grupos = Object.keys(ETIQUETAS_GRUPO) as GrupoUpdrs[];
  const gruposVisibles = grupos.filter(g => principal.maximoPorGrupo[g] > 0);
  const cabecera = esTest
    ? `Test de levodopa — ${patientName}${contexto.horasLavado ? ` · lavado ${contexto.horasLavado} h` : ''}${contexto.dosisPruebaMg ? ` · ${contexto.dosisPruebaMg} mg` : ''}`
    : `Resumen — ${patientName} · ${modo} · ${MED[contexto.medicacion]}${DBS[contexto.estimulacion] ? ` · ${DBS[contexto.estimulacion]}` : ''}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ gap: 20 }}>
        <div className="section-header">{cabecera}</div>

        {esTest ? (
          <>
            <div className="responsive-split-2fr1fr" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>
              <div className="updrs-total">
                <span className="form-label"><FlaskConical size={11} style={{ display: 'inline', verticalAlign: -1 }} /> Respuesta a levodopa</span>
                <span className="updrs-total-valor">{resp?.mejoria !== null && resp?.mejoria !== undefined ? `${resp.mejoria.toFixed(1)}` : '—'}<span className="updrs-total-unidad">%</span></span>
                {resp?.mejorOn && <span className="updrs-total-max">OFF {resp.off} → mejor ON {resp.mejorOn.total} ({resp.mejorOn.etiqueta})</span>}
                {resp?.positiva !== null && resp?.positiva !== undefined && (
                  <span className={`chip ${resp.positiva ? 'chip-accent' : 'chip-alerta'}`} style={{ marginTop: 8 }}>
                    Test {resp.positiva ? 'positivo' : 'negativo'} · umbral ≥ {UMBRAL_RESPUESTA_LEVODOPA} %
                  </span>
                )}
              </div>
              <table className="updrs-historial">
                <thead><tr><th>Toma</th><th style={{ textAlign: 'right' }}>Total</th><th style={{ textAlign: 'right' }}>Mejoría</th>
                  {gruposVisibles.map(g => <th key={g} style={{ textAlign: 'right' }}>{ETIQUETAS_GRUPO[g]}</th>)}</tr></thead>
                <tbody>
                  {resumenes.map(({ t, r }) => {
                    const m = resp?.porToma.find(x => x.id === t.id)?.mejoria;
                    const mejor = resp?.mejorOn?.id === t.id;
                    return (
                      <tr key={t.id} className={mejor ? 'fila-destacada' : ''}>
                        <td><span className={`updrs-tab-estado ${t.estado === 'ON' ? 'on' : ''}`}>{t.estado}</span> {t.minutos ? `${t.minutos} min` : 'basal'}</td>
                        <td className="num">{r.completos ? `${r.total}/${r.maximo}` : '—'}{r.completos && r.completos < r.esperados ? ' *' : ''}</td>
                        <td className="num">{m !== null && m !== undefined ? `${m.toFixed(1)} %` : '—'}</td>
                        {gruposVisibles.map(g => <td key={g} className="num">{r.completos ? r.porGrupo[g] : '—'}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {resp?.mejorOn && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="form-label">Mejoría por dominio en el mejor ON</span>
                {gruposVisibles.map(g => {
                  const v = resp.porGrupo[g];
                  return (
                    <div key={g} className="updrs-grupo">
                      <span className="updrs-grupo-nombre">{ETIQUETAS_GRUPO[g]}</span>
                      <div className="updrs-progreso"><div style={{ width: `${Math.max(0, Math.min(100, v ?? 0))}%` }} /></div>
                      <span className="updrs-grupo-valor">{v === null ? '—' : `${v.toFixed(0)} %`}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <ResumenUnico r={principal} previaPre={modo === 'POST' ? previaPre : null} />
        )}

        {!completo && (
          <div className="warning-banner">
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>Hay puntuaciones sin completar (*). Puede guardar igual; la evaluación quedará marcada como incompleta y el total no será comparable.</span>
          </div>
        )}
      </div>

      <div className="card" style={{ gap: 14 }}>
        <div className="section-header">Datos complementarios{esTest ? ' por toma' : ''}</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="updrs-historial updrs-complementarios">
            <thead><tr>{esTest && <th>Toma</th>}<th>¿Discinesias durante el examen?</th><th>¿Interfirieron con la puntuación?</th><th>Hoehn y Yahr</th></tr></thead>
            <tbody>
              {tomas.map(t => (
                <tr key={t.id}>
                  {esTest && <td style={{ whiteSpace: 'nowrap' }}>{t.etiqueta}</td>}
                  <td><SiNo valor={t.discinesiasPresentes} onCambiar={v => actualizarToma(t.id, x => ({ ...x, discinesiasPresentes: v, discinesiasInterfirieron: v ? x.discinesiasInterfirieron : null }))} /></td>
                  <td><SiNo valor={t.discinesiasInterfirieron} onCambiar={v => actualizarToma(t.id, x => ({ ...x, discinesiasInterfirieron: v }))} /></td>
                  <td>
                    <select className="select-input" value={t.hoehnYahr ?? ''} onChange={e => actualizarToma(t.id, x => ({ ...x, hoehnYahr: e.target.value || null }))}>
                      <option value="">—</option>
                      {HOEHN_YAHR.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="form-group">
          <label className="form-label">Observaciones</label>
          <textarea className="input-text" rows={2} value={observaciones} onChange={e => setObservaciones(e.target.value)}
            placeholder="Tolerancia a la dosis de prueba, parámetros de estimulación, eventos durante el examen…" style={{ resize: 'vertical' }} />
        </div>
      </div>

      <div className="card" style={{ gap: 14 }}>
        <div className="section-header" style={{ justifyContent: 'space-between' }}>
          <span>Informe para la historia clínica</span>
          {editada && (
            <button type="button" className="info-boton" onClick={() => setNarrativa(null)}><RefreshCw size={13} /> Regenerar</button>
          )}
        </div>
        <textarea className="input-text updrs-narrativa" rows={8} value={texto} onChange={e => setNarrativa(e.target.value)} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Borrador generado con los datos cargados. Revíselo y edítelo antes de copiarlo.</span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={copiar}>{copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiado' : 'Copiar texto'}</button>
          <button type="button" className="btn btn-secondary" onClick={() => exportarUpdrsPDF(datosInforme())}><FileText size={14} /> Descargar PDF</button>
          <button type="button" className="btn btn-secondary" onClick={() => exportarUpdrsExcel(datosInforme())}><FileSpreadsheet size={14} /> Descargar Excel</button>
        </div>
      </div>

      <div className="card" style={{ gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-outline" onClick={onVolver}><ArrowLeft size={13} /> Volver al protocolo</button>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {estado === 'ok' && (
              <button type="button" className="btn btn-secondary" onClick={onNueva}><RotateCcw size={13} /> Nueva evaluación</button>
            )}
            <button type="button" className="btn btn-primary" onClick={guardar} disabled={estado === 'guardando' || estado === 'ok' || !patientId}>
              <Save size={14} /> {estado === 'ok' ? 'Guardada' : estado === 'guardando' ? 'Guardando…' : 'Guardar evaluación'}
            </button>
          </div>
        </div>
        {estado === 'error' && <div className="warning-banner">No se pudo guardar: {error}</div>}
      </div>

      {previas.length > 0 && (
        <div className="card" style={{ gap: 12 }}>
          <div className="section-header">Historial UPDRS III del paciente</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="updrs-historial">
              <thead><tr><th>Fecha</th><th>Estado</th><th>Modalidad</th><th>DBS</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {[...previas].reverse().map(p => {
                  const c = p.datos?.contexto;
                  const test = c?.modalidad === 'LEVODOPA';
                  const mej = p.datos?.respuesta?.mejoria;
                  return (
                    <tr key={p.id}>
                      <td>{new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td><span className={`chip ${p.modo === 'POST' ? 'chip-accent' : ''}`}>{p.modo}</span></td>
                      <td>{test ? `Test L-dopa${mej !== null && mej !== undefined ? ` · ${mej.toFixed(1)} %` : ''}` : c?.medicacion ? MED[c.medicacion] : '—'}</td>
                      <td>{c?.estimulacion ? (DBS[c.estimulacion] || '—') : '—'}</td>
                      <td className="num">{p.puntaje_total ?? '—'}{p.datos?.completo === false ? ' *' : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {previas.some(p => p.datos?.completo === false) && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>* evaluación incompleta · en tests de levodopa, el total corresponde al OFF basal</span>
          )}
        </div>
      )}
    </div>
  );
}

function ResumenUnico({ r, previaPre }: { r: ReturnType<typeof resumirPuntajes>; previaPre: PreviaUpdrs | null }) {
  const grupos = (Object.keys(ETIQUETAS_GRUPO) as GrupoUpdrs[]).filter(g => r.maximoPorGrupo[g] > 0);
  const mejoria = previaPre && previaPre.total > 0 ? ((previaPre.total - r.total) / previaPre.total) * 100 : null;
  return (
    <div className="responsive-split-2fr1fr" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>
      <div className="updrs-total">
        <span className="form-label">Puntaje total</span>
        <span className="updrs-total-valor">{r.total}</span>
        <span className="updrs-total-max">de {r.maximo}</span>
        {mejoria !== null && (
          <span className={`chip ${mejoria >= 0 ? 'chip-accent' : ''}`} style={{ marginTop: 8 }}>
            {mejoria >= 0 ? 'Mejoría' : 'Empeoramiento'} {Math.abs(mejoria).toFixed(0)} % vs. PRE ({previaPre!.total})
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {grupos.map(g => (
          <div key={g} className="updrs-grupo">
            <span className="updrs-grupo-nombre">{ETIQUETAS_GRUPO[g]}</span>
            <div className="updrs-progreso"><div style={{ width: `${(r.porGrupo[g] / r.maximoPorGrupo[g]) * 100}%` }} /></div>
            <span className="updrs-grupo-valor">{r.porGrupo[g]}<span className="unit"> / {r.maximoPorGrupo[g]}</span></span>
          </div>
        ))}
        <div className="section-divider" />
        <div className="updrs-grupo"><span className="updrs-grupo-nombre">Hemicuerpo derecho</span><span className="updrs-grupo-valor" style={{ marginLeft: 'auto' }}>{r.derecha}</span></div>
        <div className="updrs-grupo"><span className="updrs-grupo-nombre">Hemicuerpo izquierdo</span><span className="updrs-grupo-valor" style={{ marginLeft: 'auto' }}>{r.izquierda}</span></div>
        {r.asimetria !== null && (
          <div className="updrs-grupo">
            <span className="updrs-grupo-nombre">Asimetría</span>
            <span className="updrs-grupo-valor" style={{ marginLeft: 'auto' }}>
              {Math.abs(r.asimetria).toFixed(0)} % {r.asimetria > 0 ? 'peor a derecha' : r.asimetria < 0 ? 'peor a izquierda' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
