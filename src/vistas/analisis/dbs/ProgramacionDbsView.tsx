'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, Armchair, Footprints, ScanFace, Activity, Camera, Save, TrendingUp, TrendingDown, Minus, CheckCircle2,
} from 'lucide-react';
import { useCaptureData } from '@/vistas/hooks/useCaptureData';
import { InfoModulo } from '../InfoModulo';
import { Potenciometro } from './Potenciometro';
import { PruebaDbsFlow, PruebaDbs } from './PruebasDbs';
import {
  Firma, TipoFirma, ParametrosLado, PARAMETROS_INICIALES, RANGOS, ETIQUETA_TIPO_FIRMA, resumenParametros,
  METRICAS, Dominio, ETIQUETA_DOMINIO, cambioClinico,
} from '@/biblioteca/math/programacionDbs';

const CLAVE_BORRADOR = 'nv-dbs-borrador-v1';

interface SesionPrevia { id: string; created_at: string; datos: { firmas?: Firma[] } }

interface Borrador { firmas: Firma[]; activaId: string; tallaCm: number }

const nuevaId = () => Math.random().toString(36).slice(2, 10);
const ahoraISO = () => new Date().toISOString();
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

function firmaInicial(): Firma {
  return {
    id: nuevaId(), etiqueta: 'Basal', tipo: 'BASAL', hora: ahoraISO(), notas: '',
    parametros: { D: { ...PARAMETROS_INICIALES }, I: { ...PARAMETROS_INICIALES } },
  };
}

function leerBorrador(): Partial<Borrador> {
  try { const r = typeof window !== 'undefined' ? sessionStorage.getItem(CLAVE_BORRADOR) : null; return r ? JSON.parse(r) : {}; } catch { return {}; }
}

const sinEstimulacion = (t: TipoFirma) => t === 'OFF_DISPOSITIVO' || t === 'PREOPERATORIO';

/**
 * Módulo — Modo programador DBS.
 *
 * Cada cambio de programación se registra como una "firma": parámetros por
 * electrodo (mA, µs, Hz) + pruebas rápidas por cámara (sentado, marcha,
 * expresión facial). Las firmas se comparan por dominio contra una
 * referencia: el basal de ingreso del día, el OFF de dispositivo o el
 * preoperatorio, de esta sesión o de sesiones anteriores guardadas.
 */
export function ProgramacionDbsView() {
  const [borrador] = useState<Partial<Borrador>>(leerBorrador);
  const [firmas, setFirmas] = useState<Firma[]>(() => (borrador.firmas?.length ? borrador.firmas : [firmaInicial()]));
  const [activaId, setActivaId] = useState<string>(() => borrador.activaId ?? firmas[0].id);
  const [tallaCm, setTallaCm] = useState(borrador.tallaCm ?? 170);
  const [prueba, setPrueba] = useState<PruebaDbs | null>(null);
  const [previas, setPrevias] = useState<SesionPrevia[]>([]);
  const [recarga, setRecarga] = useState(0);
  const [guardado, setGuardado] = useState<'idle' | 'guardando' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const { patients, selectedPatientId, setSelectedPatientId } = useCaptureData();

  useEffect(() => {
    try { sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ firmas, activaId, tallaCm })); } catch { /* noop */ }
  }, [firmas, activaId, tallaCm]);

  useEffect(() => {
    if (!selectedPatientId) return;
    let vigente = true;
    fetch(`/api/evaluaciones?patientId=${encodeURIComponent(selectedPatientId)}&tipo=PROGRAMACION_DBS`)
      .then(r => (r.ok ? r.json() : []))
      .then((rows: SesionPrevia[]) => { if (vigente) setPrevias(rows); })
      .catch(() => {});
    return () => { vigente = false; };
  }, [selectedPatientId, recarga]);

  const activa = firmas.find(f => f.id === activaId) ?? firmas[0];
  const actualizar = (f: (x: Firma) => Firma) => { setFirmas(fs => fs.map(x => (x.id === activa.id ? f(x) : x))); setGuardado('idle'); };
  const setParam = (lado: 'D' | 'I', p: Partial<ParametrosLado>) =>
    actualizar(x => ({ ...x, parametros: { ...x.parametros, [lado]: { ...x.parametros[lado], ...p } } }));

  const agregarFirma = () => {
    const n = firmas.filter(f => f.tipo === 'PROGRAMA').length + 1;
    const f: Firma = {
      id: nuevaId(), etiqueta: `Programa ${n}`, tipo: 'PROGRAMA', hora: ahoraISO(), notas: '',
      parametros: sinEstimulacion(activa.tipo) ? { D: { ...PARAMETROS_INICIALES }, I: { ...PARAMETROS_INICIALES } } : structuredClone(activa.parametros),
    };
    setFirmas(fs => [...fs, f]); setActivaId(f.id); setGuardado('idle');
  };
  const borrarFirma = () => {
    if (firmas.length < 2) return;
    const resto = firmas.filter(f => f.id !== activa.id);
    setFirmas(resto); setActivaId(resto[resto.length - 1].id);
  };
  const nuevaSesion = () => {
    const f = firmaInicial(); setFirmas([f]); setActivaId(f.id); setGuardado('idle');
  };

  const guardarSesion = async () => {
    setGuardado('guardando'); setError(null);
    try {
      const r = await fetch('/api/evaluaciones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: selectedPatientId, tipo: 'PROGRAMACION_DBS', modo: 'POST', puntaje_total: null, datos: { version: 1, tallaCm, firmas } }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`);
      setGuardado('ok'); setRecarga(n => n + 1);
    } catch (e) { setGuardado('error'); setError(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="main-content">
      <Link href="/" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: 11, padding: '6px 12px' }}>
        <ArrowLeft size={13} /> Volver al inicio
      </Link>
      <div className="modulo-cabecera">
        <div>
          <h1 style={{ fontSize: 20 }}>Modo programador DBS</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Una firma motora por cada ajuste de estimulación, comparada contra basal, OFF o preoperatorio.</p>
        </div>
        <InfoModulo modulo="dbs" />
      </div>

      {prueba ? (
        <PruebaDbsFlow prueba={prueba} tallaCm={tallaCm} titulo={activa.etiqueta}
          onCancelar={() => setPrueba(null)}
          onGuardar={r => { actualizar(x => ({ ...x, ...r })); setPrueba(null); window.scrollTo({ top: 0 }); }} />
      ) : (
        <>
          <div className="card" style={{ gap: 14 }}>
            <div className="responsive-form-2fr1fr" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Paciente</label>
                <select className="select-input" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Talla (cm) — para la marcha</label>
                <input className="input-text" type="number" min={100} max={220} value={tallaCm} onChange={e => setTallaCm(Math.max(100, Math.min(220, Number(e.target.value) || 170)))} />
              </div>
            </div>
          </div>

          {/* Firmas de la sesión */}
          <div className="dbs-firmas" role="tablist" aria-label="Firmas de la sesión">
            {firmas.map(f => (
              <button key={f.id} type="button" role="tab" aria-selected={f.id === activa.id} className={`dbs-firma-chip ${f.id === activa.id ? 'active' : ''}`} onClick={() => setActivaId(f.id)}>
                <span className="dbs-firma-nombre">{f.etiqueta}</span>
                <span className="dbs-firma-sub">{sinEstimulacion(f.tipo) ? ETIQUETA_TIPO_FIRMA[f.tipo] : hora(f.hora)}</span>
                <span className="dbs-firma-pruebas" aria-label="Pruebas realizadas">
                  {(['sentado', 'marcha', 'facial'] as const).map(k => <i key={k} className={f[k] ? 'ok' : ''} />)}
                </span>
              </button>
            ))}
            <button type="button" className="dbs-firma-chip nueva" onClick={agregarFirma}><Plus size={14} /> Nueva firma</button>
          </div>

          <div className="card" style={{ gap: 18 }}>
            <div className="responsive-form-2fr1fr-auto" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <div className="form-group">
                <label className="form-label">Nombre de la firma</label>
                <input className="input-text" value={activa.etiqueta} onChange={e => actualizar(x => ({ ...x, etiqueta: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="select-input" value={activa.tipo} onChange={e => actualizar(x => ({ ...x, tipo: e.target.value as TipoFirma }))}>
                  {(Object.keys(ETIQUETA_TIPO_FIRMA) as TipoFirma[]).map(t => <option key={t} value={t}>{ETIQUETA_TIPO_FIRMA[t]}</option>)}
                </select>
              </div>
              <button type="button" className="btn btn-danger" onClick={borrarFirma} disabled={firmas.length < 2} aria-label="Eliminar firma"><Trash2 size={14} /></button>
            </div>

            {sinEstimulacion(activa.tipo) ? (
              <div className="info-banner"><span>{activa.tipo === 'PREOPERATORIO' ? 'Firma preoperatoria: sin dispositivo.' : 'Dispositivo apagado: sin estimulación.'} Sirve como referencia para comparar los programas.</span></div>
            ) : (
              <div className="dbs-electrodos">
                {(['D', 'I'] as const).map(lado => {
                  const p = activa.parametros[lado];
                  return (
                    <div key={lado} className={`dbs-electrodo ${p.activo ? '' : 'apagado'}`}>
                      <div className="dbs-electrodo-cabecera">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>Electrodo {lado === 'D' ? 'derecho' : 'izquierdo'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>actúa sobre el hemicuerpo {lado === 'D' ? 'izquierdo' : 'derecho'}</div>
                        </div>
                        <div className="segmented-control" style={{ width: 120 }}>
                          <button type="button" className={`segmented-option ${!p.activo ? 'active-warning' : ''}`} onClick={() => setParam(lado, { activo: false })}>OFF</button>
                          <button type="button" className={`segmented-option ${p.activo ? 'active' : ''}`} onClick={() => setParam(lado, { activo: true })}>ON</button>
                        </div>
                      </div>
                      <div className="dbs-potes">
                        {(['mA', 'us', 'Hz'] as const).map(k => (
                          <Potenciometro key={k} etiqueta={RANGOS[k].etiqueta} unidad={RANGOS[k].unidad} valor={p[k]}
                            min={RANGOS[k].min} max={RANGOS[k].max} paso={RANGOS[k].paso} decimales={k === 'mA' ? 1 : 0}
                            deshabilitado={!p.activo} onCambiar={v => setParam(lado, { [k]: v })} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Notas (contactos, polaridad, efectos adversos)</label>
              <input className="input-text" value={activa.notas} placeholder="p. ej. 1-/C+, parestesias transitorias a 3,5 mA"
                onChange={e => actualizar(x => ({ ...x, notas: e.target.value }))} />
            </div>

            <div className="section-divider" />
            <div className="dbs-pruebas">
              <TarjetaPrueba icon={Armchair} titulo="1. Sentado" desc="Temblor y discinesias en reposo" hecho={!!activa.sentado}
                resumen={activa.sentado ? `Temblor máx. ${activa.sentado.temblorMaxCm.toFixed(1)} cm · discinesias ${activa.sentado.indiceDiscinesias.toFixed(1)} cm` : null}
                onMedir={() => setPrueba('sentado')} />
              <TarjetaPrueba icon={Footprints} titulo="2. Marcha" desc="Amplitud y cadencia del paso" hecho={!!activa.marcha}
                resumen={activa.marcha ? `Paso ${activa.marcha.longitudMediaCm.toFixed(0)} cm · ${activa.marcha.cadencia.toFixed(0)} p/min` : null}
                onMedir={() => setPrueba('marcha')} />
              <TarjetaPrueba icon={ScanFace} titulo="3. Expresión facial" desc="Pico, cejas y sonrisa" hecho={!!activa.facial}
                resumen={activa.facial ? `Índice ${activa.facial.indiceGlobal.toFixed(1)} % DIC · asim. ${activa.facial.asimetriaGlobal.toFixed(0)} %` : null}
                onMedir={() => setPrueba('facial')} />
              <div className="dbs-prueba proximamente">
                <div className="dbs-prueba-icono"><Activity size={18} /></div>
                <div style={{ flex: 1 }}><div className="dbs-prueba-titulo">Acelerómetro</div><div className="dbs-prueba-desc">Temblor y discinesias con sensor inercial</div></div>
                <span className="modulo-badge-soon" style={{ position: 'static' }}>Próximamente</span>
              </div>
            </div>
          </div>

          <Comparacion firmas={firmas} previas={previas} />

          <div className="card" style={{ gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{firmas.length} firma{firmas.length === 1 ? '' : 's'} en esta sesión · {previas.length} sesión{previas.length === 1 ? '' : 'es'} anterior{previas.length === 1 ? '' : 'es'} guardada{previas.length === 1 ? '' : 's'}</span>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {guardado === 'ok' && <button type="button" className="btn btn-secondary" onClick={nuevaSesion}>Nueva sesión</button>}
                <button type="button" className="btn btn-primary" onClick={guardarSesion} disabled={guardado === 'guardando' || guardado === 'ok' || !selectedPatientId}>
                  <Save size={14} /> {guardado === 'ok' ? 'Sesión guardada' : guardado === 'guardando' ? 'Guardando…' : 'Guardar sesión'}
                </button>
              </div>
            </div>
            {guardado === 'error' && <div className="warning-banner">No se pudo guardar: {error}</div>}
          </div>
        </>
      )}
    </div>
  );
}

function TarjetaPrueba({ icon: Icon, titulo, desc, hecho, resumen, onMedir }: {
  icon: typeof Armchair; titulo: string; desc: string; hecho: boolean; resumen: string | null; onMedir: () => void;
}) {
  return (
    <div className={`dbs-prueba ${hecho ? 'hecha' : ''}`}>
      <div className="dbs-prueba-icono">{hecho ? <CheckCircle2 size={18} /> : <Icon size={18} />}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="dbs-prueba-titulo">{titulo}</div>
        <div className="dbs-prueba-desc">{resumen ?? desc}</div>
      </div>
      <button type="button" className={`btn ${hecho ? 'btn-outline' : 'btn-primary'}`} style={{ fontSize: 12 }} onClick={onMedir}>
        <Camera size={13} /> {hecho ? 'Remedir' : 'Medir'}
      </button>
    </div>
  );
}

/* ---------------- Comparación ---------------- */

interface FirmaRef { clave: string; firma: Firma; origen: string }

function Comparacion({ firmas, previas }: { firmas: Firma[]; previas: SesionPrevia[] }) {
  const [dominio, setDominio] = useState<Dominio>('temblor');
  const metricas = METRICAS.filter(m => m.dominio === dominio);
  const [clave, setClave] = useState(metricas[0].clave);
  const metrica = METRICAS.find(m => m.clave === clave && m.dominio === dominio) ?? metricas[0];

  const referencias: FirmaRef[] = useMemo(() => [
    ...firmas.map(f => ({ clave: `hoy:${f.id}`, firma: f, origen: 'Hoy' })),
    ...[...previas].reverse().flatMap(p => (p.datos.firmas ?? []).map(f => ({
      clave: `${p.id}:${f.id}`, firma: f, origen: new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }),
    }))),
  ], [firmas, previas]);

  // Referencia por defecto: el basal de ingreso de hoy (se puede cambiar por OFF o preoperatorio).
  const porDefecto = referencias.find(r => r.origen === 'Hoy' && r.firma.tipo === 'BASAL') ?? referencias[0];
  const [refClave, setRefClave] = useState<string | null>(null);
  const ref = referencias.find(r => r.clave === refClave) ?? porDefecto;
  const valorRef = ref ? metrica.valor(ref.firma) : undefined;

  const filas = [
    ...(ref && ref.origen !== 'Hoy' ? [ref] : []),
    ...referencias.filter(r => r.origen === 'Hoy'),
  ].map(r => ({ r, v: metrica.valor(r.firma) }));
  const maxV = Math.max(1e-6, ...filas.map(f => (typeof f.v === 'number' ? f.v : 0)));

  return (
    <div className="card" style={{ gap: 16 }}>
      <div className="section-header">Comparación de firmas</div>
      <div className="segmented-control" style={{ flexWrap: 'wrap' }}>
        {(Object.keys(ETIQUETA_DOMINIO) as Dominio[]).map(d => (
          <button key={d} type="button" className={`segmented-option ${d === dominio ? 'active' : ''}`}
            onClick={() => { setDominio(d); setClave(METRICAS.find(m => m.dominio === d)!.clave); }}>{ETIQUETA_DOMINIO[d]}</button>
        ))}
      </div>
      <div className="responsive-form-2fr1fr" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Métrica</label>
          <select className="select-input" value={metrica.clave} onChange={e => setClave(e.target.value)}>
            {metricas.map(m => <option key={m.clave} value={m.clave}>{m.etiqueta}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Comparar contra</label>
          <select className="select-input" value={ref?.clave ?? ''} onChange={e => setRefClave(e.target.value)}>
            {referencias.map(r => <option key={r.clave} value={r.clave}>{r.origen} · {r.firma.etiqueta} ({ETIQUETA_TIPO_FIRMA[r.firma.tipo]})</option>)}
          </select>
        </div>
      </div>

      <div className="dbs-barras">
        {filas.map(({ r, v }) => {
          const esRef = r.clave === ref?.clave;
          const c = typeof v === 'number' && typeof valorRef === 'number' && !esRef ? cambioClinico(metrica, v, valorRef) : null;
          return (
            <div key={r.clave} className={`dbs-barra ${esRef ? 'ref' : ''}`}>
              <div className="dbs-barra-etq">
                <span className="dbs-barra-nombre">{r.firma.etiqueta}{r.origen !== 'Hoy' ? ` · ${r.origen}` : ''}{esRef ? ' · referencia' : ''}</span>
                <span className="dbs-barra-param">{resumenParametros(r.firma)}</span>
              </div>
              <div className="dbs-barra-pista">
                {typeof v === 'number' ? <div style={{ width: `${Math.max(1.5, (v / maxV) * 100)}%` }} /> : null}
              </div>
              <span className="dbs-barra-valor">{typeof v === 'number' ? `${v.toFixed(1)}${metrica.unidad ? ` ${metrica.unidad}` : ''}` : 'sin medir'}</span>
              <span className={`dbs-barra-cambio ${c === null ? '' : c > 5 ? 'mejor' : c < -5 ? 'peor' : ''}`}>
                {c === null ? '' : <>{c > 5 ? <TrendingUp size={12} /> : c < -5 ? <TrendingDown size={12} /> : <Minus size={12} />} {c > 0 ? '+' : ''}{c.toFixed(0)} %</>}
              </span>
            </div>
          );
        })}
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        Cambio con signo clínico respecto de la referencia: positivo = mejoría ({metrica.mejor === 'menor' ? 'menor valor es mejor' : 'mayor valor es mejor'}).
      </span>
    </div>
  );
}
