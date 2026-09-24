'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Camera, ChevronRight, ClipboardList, Info, Save, CheckCircle2, AlertTriangle, RotateCcw,
} from 'lucide-react';
import { useCaptureData } from '@/vistas/hooks/useCaptureData';
import {
  ITEMS_UPDRS3, N_PUNTUACIONES, PUNTAJE_MAXIMO, Puntajes, resumirPuntajes, ETIQUETAS_GRUPO, MAXIMO_POR_GRUPO,
  HOEHN_YAHR, ContextoUpdrs, CONTEXTO_INICIAL, GrupoUpdrs, ItemUpdrs, SubItemUpdrs,
} from '@/biblioteca/math/updrs';
import { PuntajeSelector } from './PuntajeSelector';
import { TareaCamaraFlow, MedicionGuardada } from './TareaCamaraFlow';

type Fase = 'contexto' | 'protocolo' | 'resumen';

interface EvaluacionPrevia {
  id: string;
  modo: string;
  puntaje_total: number | null;
  created_at: string;
  datos: { contexto?: ContextoUpdrs; completo?: boolean };
}

const CLAVE_BORRADOR = 'nv-updrs3-borrador';

interface Borrador {
  contexto: ContextoUpdrs;
  modo: string;
  puntajes: Puntajes;
  mediciones: Record<string, MedicionGuardada>;
  observaciones: string;
}

function leerBorrador(): Partial<Borrador> {
  try {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(CLAVE_BORRADOR) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Módulo 7 — UPDRS III asistida.
 *
 * Flujo: contexto de la evaluación (paciente, PRE/POST, medicación, DBS) →
 * protocolo ítem por ítem (33 puntuaciones) → resumen y guardado. Los
 * ítems que la cámara puede cuantificar abren el mismo patrón que el resto
 * de los módulos (instructivo animado → captura cronometrada → resultado),
 * proponen un puntaje y el evaluador lo confirma o corrige. El borrador se
 * conserva en la pestaña (sessionStorage) para no perder un examen a medias.
 */
export function UpdrsView() {
  // El componente se renderiza sólo en el cliente (ver page.tsx), así que el
  // borrador puede leerse en el inicializador sin desfasaje de hidratación.
  const [borrador] = useState<Partial<Borrador>>(leerBorrador);
  const [fase, setFase] = useState<Fase>('contexto');
  const [contexto, setContexto] = useState<ContextoUpdrs>({ ...CONTEXTO_INICIAL, ...borrador.contexto });
  const [modo, setModo] = useState(borrador.modo ?? 'PRE');
  const [puntajes, setPuntajes] = useState<Puntajes>(borrador.puntajes ?? {});
  const [mediciones, setMediciones] = useState<Record<string, MedicionGuardada>>(borrador.mediciones ?? {});
  const [observaciones, setObservaciones] = useState(borrador.observaciones ?? '');
  const [activo, setActivo] = useState<{ item: ItemUpdrs; sub: SubItemUpdrs } | null>(null);

  const { patients, selectedPatientId, setSelectedPatientId } = useCaptureData();

  useEffect(() => {
    try {
      const b: Borrador = { contexto, modo, puntajes, mediciones, observaciones };
      sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(b));
    } catch { /* noop */ }
  }, [contexto, modo, puntajes, mediciones, observaciones]);

  const resumen = useMemo(() => resumirPuntajes(puntajes), [puntajes]);

  const setPuntaje = useCallback((id: string, v: number | undefined) => {
    setPuntajes(p => ({ ...p, [id]: v }));
  }, []);

  const nuevaEvaluacion = () => {
    setPuntajes({}); setMediciones({}); setObservaciones(''); setContexto(CONTEXTO_INICIAL); setModo('PRE');
    try { sessionStorage.removeItem(CLAVE_BORRADOR); } catch { /* noop */ }
    setFase('contexto');
  };

  const irA = (f: Fase) => { setFase(f); window.scrollTo({ top: 0 }); };

  return (
    <div className="main-content">
      <Link href="/" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: 11, padding: '6px 12px' }}>
        <ArrowLeft size={13} /> Volver al inicio
      </Link>

      <div>
        <h1 style={{ fontSize: 20 }}>UPDRS III</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Examen motor ítem por ítem, con medición asistida por cámara.</p>
      </div>

      {activo ? (
        <TareaCamaraFlow
          item={activo.item}
          sub={activo.sub}
          onCancelar={() => setActivo(null)}
          onConfirmar={(p, med) => {
            setPuntaje(activo.sub.id, p);
            setMediciones(m => ({ ...m, [activo.sub.id]: med }));
            setActivo(null);
          }}
        />
      ) : (
        <>
          <Pasos fase={fase} onIr={irA} />

          {fase === 'contexto' && (
            <ContextoCard
              contexto={contexto} setContexto={setContexto} modo={modo} setModo={setModo}
              patients={patients} selectedPatientId={selectedPatientId} setSelectedPatientId={setSelectedPatientId}
              onContinuar={() => irA('protocolo')}
            />
          )}

          {fase === 'protocolo' && (
            <>
              <BarraProgreso total={resumen.total} completos={resumen.completos} onResumen={() => irA('resumen')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ITEMS_UPDRS3.map(item => (
                  <ItemCard key={item.numero} item={item} puntajes={puntajes} mediciones={mediciones}
                    onPuntaje={setPuntaje} onMedir={sub => { setActivo({ item, sub }); window.scrollTo({ top: 0 }); }} />
                ))}
              </div>
              <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => irA('resumen')}>
                Ver resumen <ArrowRight size={14} />
              </button>
            </>
          )}

          {fase === 'resumen' && (
            <ResumenCard
              resumen={resumen} contexto={contexto} setContexto={setContexto} modo={modo}
              puntajes={puntajes} mediciones={mediciones} observaciones={observaciones} setObservaciones={setObservaciones}
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

interface ContextoProps {
  contexto: ContextoUpdrs;
  setContexto: React.Dispatch<React.SetStateAction<ContextoUpdrs>>;
  modo: string;
  setModo: (m: string) => void;
  patients: { id: string; name: string }[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  onContinuar: () => void;
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

function ContextoCard({ contexto, setContexto, modo, setModo, patients, selectedPatientId, setSelectedPatientId, onContinuar }: ContextoProps) {
  return (
    <div className="card" style={{ maxWidth: 640, width: '100%', margin: '0 auto', gap: 16 }}>
      <div className="section-header"><ClipboardList size={16} className="icon" /> Contexto de la evaluación</div>

      <div className="form-group">
        <label className="form-label">Paciente</label>
        <select className="select-input" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="responsive-form-2fr1fr" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Estado</label>
          <div className="segmented-control">
            <button type="button" className={`segmented-option ${modo === 'PRE' ? 'active-warning' : ''}`} onClick={() => setModo('PRE')}>PRE</button>
            <button type="button" className={`segmented-option ${modo === 'POST' ? 'active' : ''}`} onClick={() => setModo('POST')}>POST</button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Medicación</label>
          <Segmentado valor={contexto.medicacion} onCambiar={v => setContexto(c => ({ ...c, medicacion: v }))}
            opciones={[{ v: 'OFF', t: 'OFF' }, { v: 'ON', t: 'ON' }, { v: 'SIN_MEDICACION', t: 'Sin' }]} />
        </div>
        <div className="form-group">
          <label className="form-label">Estimulación cerebral profunda</label>
          <Segmentado valor={contexto.estimulacion} onCambiar={v => setContexto(c => ({ ...c, estimulacion: v }))}
            opciones={[{ v: 'NO_APLICA', t: 'No aplica' }, { v: 'OFF', t: 'OFF' }, { v: 'ON', t: 'ON' }]} />
        </div>
        <div className="form-group">
          <label className="form-label">Minutos desde la última dosis de levodopa</label>
          <input className="input-text" type="number" min={0} inputMode="numeric" placeholder="—"
            disabled={contexto.medicacion === 'SIN_MEDICACION'}
            value={contexto.minutosUltimaDosis ?? ''}
            onChange={e => setContexto(c => ({ ...c, minutosUltimaDosis: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) }))} />
        </div>
      </div>

      <div className="info-banner">
        <Info size={14} style={{ flexShrink: 0 }} />
        <span>
          Estructura basada en la Parte III de la MDS-UPDRS. Las descripciones de pantalla son resúmenes propios, no el texto oficial:
          el evaluador debe estar entrenado en la escala de la International Parkinson and Movement Disorder Society.
        </span>
      </div>

      <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={onContinuar} disabled={!selectedPatientId}>
        Comenzar protocolo <ChevronRight size={14} />
      </button>
    </div>
  );
}

function BarraProgreso({ total, completos, onResumen }: { total: number; completos: number; onResumen: () => void }) {
  return (
    <div className="updrs-barra">
      <div className="updrs-barra-dato">
        <span className="form-label">Total parcial</span>
        <span className="updrs-barra-valor">{total}<span className="unit"> / {PUNTAJE_MAXIMO}</span></span>
      </div>
      <div className="updrs-barra-dato" style={{ flex: 1, minWidth: 140 }}>
        <span className="form-label">Puntuados {completos} / {N_PUNTUACIONES}</span>
        <div className="updrs-progreso"><div style={{ width: `${(completos / N_PUNTUACIONES) * 100}%` }} /></div>
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
        {completo && <CheckCircle2 size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
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
  resumen: ReturnType<typeof resumirPuntajes>;
  contexto: ContextoUpdrs;
  setContexto: React.Dispatch<React.SetStateAction<ContextoUpdrs>>;
  modo: string;
  puntajes: Puntajes;
  mediciones: Record<string, MedicionGuardada>;
  observaciones: string;
  setObservaciones: (s: string) => void;
  patientId: string;
  patientName: string;
  onVolver: () => void;
  onNueva: () => void;
}

const txtMedicacion = { ON: 'ON', OFF: 'OFF', SIN_MEDICACION: 'sin medicación' } as const;
const txtDbs = { ON: 'DBS ON', OFF: 'DBS OFF', NO_APLICA: '' } as const;

function ResumenCard(props: ResumenProps) {
  const { resumen, contexto, setContexto, modo, puntajes, mediciones, observaciones, setObservaciones, patientId, patientName, onVolver, onNueva } = props;
  const [estado, setEstado] = useState<'idle' | 'guardando' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [previas, setPrevias] = useState<EvaluacionPrevia[]>([]);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (!patientId) return;
    let vigente = true;
    fetch(`/api/evaluaciones?patientId=${encodeURIComponent(patientId)}&tipo=UPDRS_III`)
      .then(r => (r.ok ? r.json() : []))
      .then((rows: EvaluacionPrevia[]) => { if (vigente) setPrevias(rows); })
      .catch(() => { /* sin conexión: se omite el historial */ });
    return () => { vigente = false; };
  }, [patientId, recarga]);

  const completo = resumen.completos === N_PUNTUACIONES;
  const faltantes = N_PUNTUACIONES - resumen.completos;

  // Comparación PRE → POST: contra la última evaluación PRE guardada.
  const ultimaPre = [...previas].reverse().find(p => p.modo === 'PRE' && p.puntaje_total !== null);
  const mejoria = modo === 'POST' && ultimaPre && ultimaPre.puntaje_total! > 0
    ? ((ultimaPre.puntaje_total! - resumen.total) / ultimaPre.puntaje_total!) * 100 : null;

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
          puntaje_total: resumen.total,
          datos: {
            version: 1,
            escala: 'MDS-UPDRS-III',
            completo,
            contexto,
            puntajes,
            mediciones,
            resumen: { ...resumen, porGrupo: resumen.porGrupo },
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ gap: 20 }}>
        <div className="section-header">Resumen — {patientName} · {modo} · {txtMedicacion[contexto.medicacion]}{txtDbs[contexto.estimulacion] ? ` · ${txtDbs[contexto.estimulacion]}` : ''}</div>

        <div className="responsive-split-2fr1fr" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>
          <div className="updrs-total">
            <span className="form-label">Puntaje total</span>
            <span className="updrs-total-valor">{resumen.total}</span>
            <span className="updrs-total-max">de {PUNTAJE_MAXIMO}</span>
            {mejoria !== null && (
              <span className={`chip ${mejoria >= 0 ? 'chip-accent' : ''}`} style={{ marginTop: 8 }}>
                {mejoria >= 0 ? 'Mejoría' : 'Empeoramiento'} {Math.abs(mejoria).toFixed(0)} % vs. PRE ({ultimaPre!.puntaje_total})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {grupos.map(g => (
              <div key={g} className="updrs-grupo">
                <span className="updrs-grupo-nombre">{ETIQUETAS_GRUPO[g]}</span>
                <div className="updrs-progreso"><div style={{ width: `${(resumen.porGrupo[g] / MAXIMO_POR_GRUPO[g]) * 100}%` }} /></div>
                <span className="updrs-grupo-valor">{resumen.porGrupo[g]}<span className="unit"> / {MAXIMO_POR_GRUPO[g]}</span></span>
              </div>
            ))}
            <div className="section-divider" />
            <div className="updrs-grupo">
              <span className="updrs-grupo-nombre">Hemicuerpo derecho</span>
              <span className="updrs-grupo-valor" style={{ marginLeft: 'auto' }}>{resumen.derecha}</span>
            </div>
            <div className="updrs-grupo">
              <span className="updrs-grupo-nombre">Hemicuerpo izquierdo</span>
              <span className="updrs-grupo-valor" style={{ marginLeft: 'auto' }}>{resumen.izquierda}</span>
            </div>
            {resumen.asimetria !== null && (
              <div className="updrs-grupo">
                <span className="updrs-grupo-nombre">Asimetría</span>
                <span className="updrs-grupo-valor" style={{ marginLeft: 'auto' }}>
                  {Math.abs(resumen.asimetria).toFixed(0)} % {resumen.asimetria > 0 ? 'peor a derecha' : resumen.asimetria < 0 ? 'peor a izquierda' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {!completo && (
          <div className="warning-banner">
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>Faltan {faltantes} puntuaciones. Puede guardar igual; la evaluación quedará marcada como incompleta y el total no será comparable.</span>
          </div>
        )}
      </div>

      <div className="card" style={{ gap: 16 }}>
        <div className="section-header">Datos complementarios</div>
        <div className="responsive-form-2fr1fr" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">¿Hubo discinesias durante el examen?</label>
            <Segmentado<'s' | 'n' | '-'> valor={contexto.discinesiasPresentes === null ? '-' : contexto.discinesiasPresentes ? 's' : 'n'}
              onCambiar={v => setContexto(c => ({ ...c, discinesiasPresentes: v === '-' ? null : v === 's', discinesiasInterfirieron: v === 's' ? c.discinesiasInterfirieron : null }))}
              opciones={[{ v: '-', t: '—' }, { v: 'n', t: 'No' }, { v: 's', t: 'Sí' }]} />
          </div>
          <div className="form-group">
            <label className="form-label">¿Interfirieron con la puntuación?</label>
            <Segmentado<'s' | 'n' | '-'> valor={contexto.discinesiasInterfirieron === null ? '-' : contexto.discinesiasInterfirieron ? 's' : 'n'}
              onCambiar={v => setContexto(c => ({ ...c, discinesiasInterfirieron: v === '-' ? null : v === 's' }))}
              opciones={[{ v: '-', t: '—' }, { v: 'n', t: 'No' }, { v: 's', t: 'Sí' }]} />
          </div>
          <div className="form-group">
            <label className="form-label">Estadio de Hoehn y Yahr</label>
            <select className="select-input" value={contexto.hoehnYahr ?? ''} onChange={e => setContexto(c => ({ ...c, hoehnYahr: e.target.value || null }))}>
              <option value="">—</option>
              {HOEHN_YAHR.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Mediciones con cámara</label>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', paddingTop: 8 }}>
              {Object.keys(mediciones).length} ítems medidos
            </span>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Observaciones</label>
          <textarea className="input-text" rows={3} value={observaciones} onChange={e => setObservaciones(e.target.value)}
            placeholder="Contexto clínico, parámetros de estimulación, eventos durante el examen…" style={{ resize: 'vertical' }} />
        </div>

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
          <table className="updrs-historial">
            <thead><tr><th>Fecha</th><th>Estado</th><th>Medicación</th><th>DBS</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              {[...previas].reverse().map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td><span className={`chip ${p.modo === 'POST' ? 'chip-accent' : ''}`}>{p.modo}</span></td>
                  <td>{p.datos?.contexto ? txtMedicacion[p.datos.contexto.medicacion] : '—'}</td>
                  <td>{p.datos?.contexto ? (txtDbs[p.datos.contexto.estimulacion] || '—') : '—'}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {p.puntaje_total ?? '—'}{p.datos?.completo === false ? ' *' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {previas.some(p => p.datos?.completo === false) && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>* evaluación incompleta</span>
          )}
        </div>
      )}
    </div>
  );
}
