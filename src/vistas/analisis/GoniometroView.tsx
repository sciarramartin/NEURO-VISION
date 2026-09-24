'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, Camera, Ruler, Shirt, Activity as ActivityIcon, Save, RotateCcw, ChevronRight
} from 'lucide-react';
import { useRecordingState } from '@/vistas/hooks/useRecordingState';
import { useCaptureData } from '@/vistas/hooks/useCaptureData';
import { RegionKey, LadoKey } from '@/biblioteca/math/angles';
import { InstructivoAnimado } from './InstructivoAnimado';
import { CapturaTimerRing } from './CapturaTimerRing';
import { useCountdown7s } from './useCountdown7s';

const WebcamCapture = dynamic(() => import('@/componentes_visuales/WebcamCapture'), { ssr: false });

type Fase = 'articulacion' | 'instrucciones' | 'captura' | 'resultado';

const ARTICULACIONES: { key: RegionKey; label: string }[] = [
  { key: 'HOMBRO', label: 'Hombro' },
  { key: 'CODO', label: 'Codo' },
  { key: 'MUÑECA', label: 'Muñeca' },
  { key: 'CADERA', label: 'Cadera' },
  { key: 'RODILLA', label: 'Rodilla' },
  { key: 'TOBILLO', label: 'Tobillo' },
];

const PASOS_INSTRUCTIVO = [
  { icon: Ruler, texto: <>Espacio <b>despejado</b>, con la cámara <b>fija</b> a una distancia aproximada de <b>1 metro</b>.</> },
  { icon: Shirt, texto: <>De ser posible, deje el <b>miembro descubierto</b> (sin mangas ni ropa que oculte la articulación).</> },
  { icon: ActivityIcon, texto: <>Pida al paciente la <b>mayor amplitud de movimiento posible</b>, de forma <b>activa</b> — sin ayuda ni asistencia manual.</> },
  { icon: ActivityIcon, texto: <>Al presionar <b>Iniciar</b> tendrá <b>7 segundos</b>: comience el movimiento apenas escuche el tono y continúe hasta el segundo tono.</> },
];

function EscenaArticular({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 300 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <text x="150" y="18" textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="var(--font-mono)">1 metro · {label} descubierto/a</text>
      <g transform="translate(150,70)">
        <line x1="-40" y1="0" x2="0" y2="0" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
        <line x1="0" y1="0" x2="30" y2="-30" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" values="-40 0 0; 20 0 0; -40 0 0" dur="2.4s" repeatCount="indefinite" />
        </line>
        <circle cx="0" cy="0" r="5" fill="var(--accent)" />
      </g>
    </svg>
  );
}

export function GoniometroView() {
  const [fase, setFase] = useState<Fase>('articulacion');
  const [capturedRaw, setCapturedRaw] = useState<{ tiempo: number; angulo: number }[]>([]);
  const [resultado, setResultado] = useState<{ min: number; max: number; prom: number; vel: number } | null>(null);
  const [modo, setModo] = useState('PRE');
  const [aviso, setAviso] = useState<string | null>(null);

  const {
    region, handleRegionChange, lado, setLado,
    isMockMode, setIsMockMode, isCameraActive, setIsCameraActive,
    isRecording, startRecording, stopRecording
  } = useRecordingState();

  const { patients, selectedPatientId, setSelectedPatientId, saveStatus, saveSession } = useCaptureData();

  const handleData = (raw: { tiempo: number; angulo: number }[]) => {
    const data = raw.filter(d => d.angulo > 0);
    setCapturedRaw(data);
    if (data.length < 2) {
      setAviso('No se pudo trackear la articulación durante la captura. Verifique que esté bien visible e intente nuevamente.');
      return;
    }
    setAviso(null);
    const angulos = data.map(d => d.angulo);
    const min = Math.min(...angulos), max = Math.max(...angulos);
    const prom = angulos.reduce((a, b) => a + b, 0) / angulos.length;
    let velMax = 0;
    for (let i = 1; i < data.length; i++) {
      const dt = data[i].tiempo - data[i - 1].tiempo;
      if (dt > 0) velMax = Math.max(velMax, Math.abs(data[i].angulo - data[i - 1].angulo) / dt);
    }
    setResultado({ min: +min.toFixed(1), max: +max.toFixed(1), prom: +prom.toFixed(1), vel: +velMax.toFixed(1) });
    setFase('resultado');
  };

  const countdown = useCountdown7s({
    onIniciar: () => { setAviso(null); startRecording(); },
    onFinalizar: () => { stopRecording(); },
  });

  const handleGuardar = async () => {
    if (!resultado) return;
    await saveSession(selectedPatientId, modo, region, lado, capturedRaw, {
      angMin: resultado.min, angMax: resultado.max, angAvg: resultado.prom, maxVel: resultado.vel, tremorFreq: 0, tremorAmp: 0
    });
  };

  const reiniciar = () => {
    setCapturedRaw([]); setResultado(null); setAviso(null); countdown.reiniciar(); setFase('instrucciones');
  };

  const articulacionLabel = ARTICULACIONES.find(a => a.key === region)?.label ?? region;

  return (
    <div className="main-content">
      <Link href="/" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: 11, padding: '6px 12px' }}>
        <ArrowLeft size={13} /> Volver al inicio
      </Link>

      <div>
        <h1 style={{ fontSize: 20 }}>Goniómetro</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Rango de movimiento activo, articulación por articulación.</p>
      </div>

      {fase === 'articulacion' && (
        <div className="card" style={{ maxWidth: 560, margin: '0 auto', gap: 16 }}>
          <div className="section-header">Elija la articulación a evaluar</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {ARTICULACIONES.map(a => (
              <button key={a.key} type="button" onClick={() => handleRegionChange(a.key)}
                className={`grupo-muscular-item ${region === a.key ? 'active' : ''}`}>
                {a.label} <ChevronRight size={14} />
              </button>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Lado</label>
            <div className="segmented-control">
              {(['DERECHA', 'IZQUIERDA'] as LadoKey[]).map(l => (
                <button key={l} type="button" className={`segmented-option ${lado === l ? 'active' : ''}`} onClick={() => setLado(l)}>
                  {l === 'DERECHA' ? 'Derecha' : 'Izquierda'}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => setFase('instrucciones')}>
            Continuar <ChevronRight size={14} />
          </button>
        </div>
      )}

      {fase === 'instrucciones' && (
        <InstructivoAnimado
          titulo={`Antes de medir: ${articulacionLabel.toLowerCase()} (${lado === 'DERECHA' ? 'derecha' : 'izquierda'})`}
          pasos={PASOS_INSTRUCTIVO}
          escena={<EscenaArticular label={articulacionLabel.toLowerCase()} />}
          textoBoton="Continuar a la cámara"
          onComenzar={() => setFase('captura')}
        />
      )}

      {fase === 'captura' && (
        <div className="card" style={{ gap: 20 }}>
          <div className="section-header">Captura — {articulacionLabel} {lado === 'DERECHA' ? 'derecha' : 'izquierda'}</div>

          <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: 11 }} disabled={countdown.fase === 'grabando'}
            onClick={() => setIsMockMode(!isMockMode)}>
            {isMockMode ? 'Usando modo simulador' : 'Usando cámara real'}
          </button>

          {!isCameraActive ? (
            <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => setIsCameraActive(true)}>
              <Camera size={14} /> Activar cámara
            </button>
          ) : (
            <>
              <WebcamCapture
                region={region} lado={lado} isRecording={isRecording} isMockMode={isMockMode}
                landmarksPersonalizados={null} modoSeleccionActivo={false} zoom={1}
                onDataCollected={handleData}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'center' }}>
                <CapturaTimerRing fase={countdown.fase} segundos={countdown.segundos} progreso={countdown.progreso} />
                {countdown.fase === 'lista' && (
                  <button type="button" onClick={countdown.iniciar} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                    Iniciar (7s)
                  </button>
                )}
                {countdown.fase === 'grabando' && (
                  <span className="captura-fase-badge grabando">Grabando movimiento activo</span>
                )}
                {countdown.fase === 'finalizada' && (
                  <span className="captura-fase-badge listo">Captura completa</span>
                )}
              </div>
            </>
          )}

          {aviso && <div className="warning-banner">{aviso}</div>}
        </div>
      )}

      {fase === 'resultado' && resultado && (
        <div className="card" style={{ gap: 20 }}>
          <div className="section-header">Resultado — {articulacionLabel} {lado === 'DERECHA' ? 'derecha' : 'izquierda'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div className="stat-card">
              <span className="stat-card-label">Mínimo</span>
              <span className="stat-card-value">{resultado.min}<span className="unit">°</span></span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Máximo</span>
              <span className="stat-card-value">{resultado.max}<span className="unit">°</span></span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">ROM</span>
              <span className="stat-card-value">{(resultado.max - resultado.min).toFixed(1)}<span className="unit">°</span></span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Vel. máx</span>
              <span className="stat-card-value">{resultado.vel}<span className="unit">°/s</span></span>
            </div>
          </div>

          <div className="section-divider" />

          <div className="responsive-form-2fr1fr-auto" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, alignItems: 'end' }}>
            <div className="form-group">
              <label className="form-label">Paciente</label>
              <select className="select-input" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <div className="segmented-control">
                <button type="button" className={`segmented-option ${modo === 'PRE' ? 'active-warning' : ''}`} onClick={() => setModo('PRE')}>PRE</button>
                <button type="button" className={`segmented-option ${modo === 'POST' ? 'active' : ''}`} onClick={() => setModo('POST')}>POST</button>
              </div>
            </div>
            <button type="button" onClick={handleGuardar} className="btn btn-primary" disabled={saveStatus === 'saving'}>
              <Save size={14} /> {saveStatus === 'success' ? 'Guardado' : 'Guardar sesión'}
            </button>
          </div>

          <button type="button" onClick={reiniciar} className="btn btn-outline" style={{ alignSelf: 'flex-start' }}>
            <RotateCcw size={13} /> Repetir medición
          </button>
        </div>
      )}
    </div>
  );
}
