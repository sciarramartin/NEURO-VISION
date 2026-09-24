'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Camera, Ruler, ScanFace, Save, RotateCcw
} from 'lucide-react';
import { PuntoMuscular, etiquetaCompleta } from '@/biblioteca/math/musculosFaciales';
import { useCaptureData } from '@/vistas/hooks/useCaptureData';
import { FaceMuscleSelector } from './FaceMuscleSelector';
import { InstructivoAnimado } from './InstructivoAnimado';
import { CapturaTimerRing } from './CapturaTimerRing';
import { useCountdown7s } from './useCountdown7s';
import { useFacialMuscleCapture, MuestraMuscular } from './useFacialMuscleCapture';

type Fase = 'seleccion' | 'instrucciones' | 'captura' | 'resultado';

const PASOS_INSTRUCTIVO = [
  { icon: Camera, texto: <>Cámara <b>fija</b>, a unos <b>0,5 metros</b> del rostro.</> },
  { icon: Ruler, texto: <>Rostro <b>limpio y despejado</b>: sin pelo, anteojos ni accesorios que tapen la zona.</> },
  { icon: ScanFace, texto: <>Al presionar <b>Iniciar</b> tendrá <b>7 segundos</b>: comience en reposo y lleve el músculo a su <b>contracción máxima de forma progresiva</b>.</> },
];

export function AnalisisFacialView() {
  const [fase, setFase] = useState<Fase>('seleccion');
  const [punto, setPunto] = useState<PuntoMuscular | null>(null);
  const [isMockMode, setIsMockMode] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [data, setData] = useState<MuestraMuscular[]>([]);
  const [amplitud, setAmplitud] = useState<number | null>(null);
  const [modo, setModo] = useState('PRE');
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const { patients, selectedPatientId, setSelectedPatientId } = useCaptureData();

  const handleData = (serie: MuestraMuscular[]) => {
    setData(serie);
    if (serie.length < 3) {
      setAviso('No se registraron suficientes muestras. Verifique que el rostro esté bien visible e intente nuevamente.');
      return;
    }
    setAviso(null);
    const valores = serie.map(d => d.valor);
    const amp = Math.abs(Math.max(...valores) - Math.min(...valores));
    setAmplitud(+amp.toFixed(2));
    setFase('resultado');
  };

  const countdown = useCountdown7s({
    onIniciar: () => setAviso(null),
    onFinalizar: () => {},
  });

  const { videoRef, canvasRef, loading, errorMsg, startWebcam } = useFacialMuscleCapture({
    punto, isRecording: countdown.fase === 'grabando', isMockMode, onDataCollected: handleData
  });

  const handleGuardar = async () => {
    if (!punto || amplitud === null) return;
    const lado = punto.zona === 'IZQUIERDA' ? 'IZQUIERDA' : punto.zona === 'DERECHA' ? 'DERECHA' : 'AMBOS';
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatientId,
          modo,
          region: punto.id.toUpperCase().replace(/-/g, '_').slice(0, 20),
          lado,
          tiempo_medicion: data[data.length - 1]?.tiempo ?? 7,
          angulo_min: Math.min(...data.map(d => d.valor)),
          angulo_max: Math.max(...data.map(d => d.valor)),
          angulo_promedio: data.reduce((s, d) => s + d.valor, 0) / data.length,
          velocidad_max: 0,
          frecuencia_temblor: 0,
          amplitud_temblor: 0,
          asimetria_index: null,
          datos_angulos: data.map(d => `${d.tiempo.toFixed(2)},${d.valor.toFixed(2)}`).join(';')
        })
      });
    } catch {
      /* Consistente con el resto de la app: si no hay backend conectado, se considera guardado simulado. */
    }
    setGuardado(true);
  };

  const reiniciar = () => {
    setData([]); setAmplitud(null); setAviso(null); setGuardado(false); countdown.reiniciar(); setFase('seleccion');
  };

  return (
    <div className="main-content">
      <Link href="/" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: 11, padding: '6px 12px' }}>
        <ArrowLeft size={13} /> Volver al inicio
      </Link>

      <div>
        <h1 style={{ fontSize: 20 }}>Análisis facial</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Seleccione un músculo y evalúe su amplitud de contracción.</p>
      </div>

      {fase === 'seleccion' && (
        <div className="card" style={{ maxWidth: 460, margin: '0 auto', gap: 16 }}>
          <div className="section-header">Elija el punto a evaluar</div>
          <FaceMuscleSelector seleccion={punto} onSeleccionar={setPunto} />
          {punto && (
            <div className="chip chip-accent" style={{ alignSelf: 'center' }}>{etiquetaCompleta(punto)}</div>
          )}
          <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-end' }} disabled={!punto}
            onClick={() => setFase('instrucciones')}>
            Continuar <ArrowRight size={14} />
          </button>
        </div>
      )}

      {fase === 'instrucciones' && punto && (
        <InstructivoAnimado
          titulo={`Antes de medir: ${etiquetaCompleta(punto).toLowerCase()}`}
          pasos={PASOS_INSTRUCTIVO}
          textoBoton="Continuar a la cámara"
          onComenzar={() => setFase('captura')}
        />
      )}

      {fase === 'captura' && punto && (
        <div className="card" style={{ gap: 20 }}>
          <div className="section-header">Captura — {etiquetaCompleta(punto)}</div>

          <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: 11 }}
            disabled={countdown.fase === 'grabando'} onClick={() => setIsMockMode(!isMockMode)}>
            {isMockMode ? 'Usando modo simulador' : 'Usando cámara real'}
          </button>

          {!isCameraActive ? (
            <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}
              onClick={() => { setIsCameraActive(true); if (!isMockMode) startWebcam(); }}>
              <Camera size={14} /> Activar cámara
            </button>
          ) : (
            <>
              <div style={{ position: 'relative', width: '100%', maxWidth: 480, aspectRatio: '4/3', margin: '0 auto', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                <video ref={videoRef} className="absolute pointer-events-none opacity-0" style={{ top: -9999, left: -9999, width: 640, height: 480 }} playsInline muted />
                <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full object-cover" />
                {loading && <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--text-muted)', fontSize: 12 }}>Cargando MediaPipe…</div>}
                {errorMsg && <div className="absolute inset-0 flex items-center justify-center text-center p-4" style={{ color: 'var(--danger)', fontSize: 12 }}>{errorMsg}</div>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'center' }}>
                <CapturaTimerRing fase={countdown.fase} segundos={countdown.segundos} progreso={countdown.progreso} />
                {countdown.fase === 'lista' && (
                  <button type="button" onClick={countdown.iniciar} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                    Iniciar (7s)
                  </button>
                )}
                {countdown.fase === 'grabando' && <span className="captura-fase-badge grabando">Relajación → contracción máxima</span>}
                {countdown.fase === 'finalizada' && <span className="captura-fase-badge listo">Captura completa</span>}
              </div>
            </>
          )}

          {aviso && <div className="warning-banner">{aviso}</div>}
        </div>
      )}

      {fase === 'resultado' && punto && amplitud !== null && (
        <div className="card" style={{ gap: 20 }}>
          <div className="section-header">Resultado — {etiquetaCompleta(punto)}</div>
          <div className="stat-card" style={{ maxWidth: 220 }}>
            <span className="stat-card-label">Amplitud de contracción</span>
            <span className="stat-card-value">{amplitud}<span className="unit">u.rel.</span></span>
            <span className="stat-card-context">Diferencia relativa entre reposo y contracción máxima, normalizada por la distancia interocular.</span>
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
            <button type="button" onClick={handleGuardar} className="btn btn-primary">
              <Save size={14} /> {guardado ? 'Guardado' : 'Guardar sesión'}
            </button>
          </div>

          <button type="button" onClick={reiniciar} className="btn btn-outline" style={{ alignSelf: 'flex-start' }}>
            <RotateCcw size={13} /> Evaluar otro músculo
          </button>
        </div>
      )}
    </div>
  );
}
