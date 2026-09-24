'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, Camera, Ruler, Footprints, Shirt, Smartphone, UserX,
  Square, Circle, Save, RotateCcw
} from 'lucide-react';
import { useRecordingState } from '@/vistas/hooks/useRecordingState';
import { useCaptureData } from '@/vistas/hooks/useCaptureData';
import { analizarCicloMarcha } from '@/biblioteca/math/gait';
import { InstructivoAnimado } from './InstructivoAnimado';

const WebcamCapture = dynamic(() => import('@/componentes_visuales/WebcamCapture'), { ssr: false });

type Fase = 'instrucciones' | 'captura' | 'resultado';

const PASOS_INSTRUCTIVO = [
  { icon: Camera, texto: <>Ubique la cámara <b>fija</b>, siempre a la <b>misma distancia (2 metros)</b> del recorrido de marcha.</> },
  { icon: Ruler, texto: <>Despeje el <b>terreno</b>: sin obstáculos ni objetos en el camino, con buena iluminación.</> },
  { icon: Footprints, texto: <>Use siempre el <b>mismo calzado</b>, cómodo — o preferentemente <b>descalzo</b>.</> },
  { icon: Shirt, texto: <>Evite ropa <b>holgada o muy ajustada</b>: cuanto menos cubra las piernas, mejor la lectura.</> },
  { icon: Smartphone, texto: <>Si filma con celular, colóquelo en posición <b>horizontal (apaisado)</b>.</> },
  { icon: UserX, texto: <>El paciente se ubica de <b>perfil, cuerpo completo</b>, en un extremo del cuadro — <b>sin acompañantes</b> en escena.</> },
  { icon: Footprints, texto: <>Presione <b>Iniciar marcha</b> y pida al paciente que camine en el <b>menor tiempo posible</b> hasta atravesar por completo el extremo opuesto; toque <b>Detener</b> apenas lo logre.</> },
];

function EscenaMarcha() {
  return (
    <svg viewBox="0 0 300 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <line x1="20" y1="95" x2="280" y2="95" stroke="var(--border-card)" strokeWidth="1" strokeDasharray="4 4" />
      <g opacity="0.5">
        <rect x="8" y="60" width="10" height="14" rx="2" fill="var(--text-muted)" />
        <rect x="282" y="60" width="10" height="14" rx="2" fill="var(--text-muted)" />
      </g>
      <text x="150" y="18" textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="var(--font-mono)">2 metros · perfil completo</text>
      <g className="nv-walk-figure">
        <g transform="translate(20,50)">
          <circle cx="0" cy="0" r="6" fill="var(--accent)" />
          <line x1="0" y1="6" x2="0" y2="28" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          <line x1="-8" y1="14" x2="8" y2="14" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          <line className="nv-walk-leg-a" x1="0" y1="28" x2="-7" y2="45" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          <line className="nv-walk-leg-b" x1="0" y1="28" x2="7" y2="45" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

export function PasoLongitudView() {
  const [fase, setFase] = useState<Fase>('instrucciones');
  const [alturaRealCm, setAlturaRealCm] = useState(170);
  const [capturedRaw, setCapturedRaw] = useState<{ tiempo: number; angulo: number; anguloContralateral?: number }[]>([]);
  const [resultado, setResultado] = useState<{ min: number; max: number; prom: number } | null>(null);
  const [modo, setModo] = useState('PRE');
  const [aviso, setAviso] = useState<string | null>(null);

  const {
    isMockMode, setIsMockMode, isCameraActive, setIsCameraActive,
    isRecording, timerText, startRecording, stopRecording, handleRegionChange
  } = useRecordingState();

  const { patients, selectedPatientId, setSelectedPatientId, saveStatus, saveSession } = useCaptureData();

  React.useEffect(() => { handleRegionChange('MARCHA'); }, [handleRegionChange]);

  const handleData = (raw: { tiempo: number; angulo: number; anguloContralateral?: number }[]) => {
    setCapturedRaw(raw);
    if (raw.length < 3) {
      setAviso('No se registró suficiente movimiento. Verifique que ambos talones sean visibles durante todo el recorrido e intente nuevamente.');
      return;
    }
    setAviso(null);
    const heightsPx = raw.map(d => d.anguloContralateral).filter((v): v is number => !!v && v > 0);
    const avgHeightPx = heightsPx.length > 0 ? heightsPx.reduce((a, b) => a + b, 0) / heightsPx.length : 350;
    const scaleCmPx = avgHeightPx > 0 ? alturaRealCm / avgHeightPx : 0.35;
    const serie = raw.map(d => ({ tiempo: d.tiempo, distanciaPixeles: d.angulo }));
    const analysis = analizarCicloMarcha(serie, scaleCmPx);
    setResultado({ min: analysis.minimoCm, max: analysis.maximoCm, prom: analysis.promedioCm });
    setFase('resultado');
  };

  const handleGuardar = async () => {
    if (!resultado) return;
    await saveSession(selectedPatientId, modo, 'MARCHA', 'DERECHA', capturedRaw, {
      angMin: resultado.min, angMax: resultado.max, angAvg: resultado.prom, maxVel: 0, tremorFreq: 0, tremorAmp: 0
    });
  };

  const reiniciar = () => {
    setCapturedRaw([]); setResultado(null); setAviso(null); setFase('instrucciones');
  };

  return (
    <div className="main-content">
      <Link href="/" className="btn btn-secondary" style={{ alignSelf: 'flex-start', fontSize: 11, padding: '6px 12px' }}>
        <ArrowLeft size={13} /> Volver al inicio
      </Link>

      <div>
        <h1 style={{ fontSize: 20 }}>Longitud del paso</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Análisis de marcha por video — amplitud de zancada estimada en centímetros.</p>
      </div>

      {fase === 'instrucciones' && (
        <InstructivoAnimado
          titulo="Antes de empezar"
          pasos={PASOS_INSTRUCTIVO}
          escena={<EscenaMarcha />}
          textoBoton="Continuar a la cámara"
          onComenzar={() => setFase('captura')}
        />
      )}

      {fase === 'captura' && (
        <div className="card" style={{ gap: 20 }}>
          <div className="section-header">Captura de marcha</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Altura del paciente (cm)</label>
              <input type="number" min={100} max={250} value={alturaRealCm} disabled={isRecording}
                onChange={e => setAlturaRealCm(Number(e.target.value))} className="input-text" />
            </div>
            <div className="form-group">
              <label className="form-label">Cámara</label>
              <button type="button" className="btn btn-secondary" disabled={isRecording}
                onClick={() => { setIsMockMode(!isMockMode); }}>
                {isMockMode ? 'Usando modo simulador' : 'Usando cámara real'}
              </button>
            </div>
          </div>

          {!isCameraActive ? (
            <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => setIsCameraActive(true)}>
              <Camera size={14} /> Activar cámara
            </button>
          ) : (
            <>
              <WebcamCapture
                region="MARCHA" lado="DERECHA" isRecording={isRecording} isMockMode={isMockMode}
                landmarksPersonalizados={null} modoSeleccionActivo={false} zoom={1}
                onDataCollected={handleData}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {!isRecording ? (
                  <button type="button" onClick={startRecording} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                    <Circle size={13} fill="currentColor" /> Iniciar marcha
                  </button>
                ) : (
                  <button type="button" onClick={stopRecording} className="btn btn-danger" style={{ padding: '10px 20px', borderColor: 'var(--danger)' }}>
                    <Square size={13} fill="currentColor" /> Detener
                  </button>
                )}
                {isRecording && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--danger)' }}>{timerText}</span>}
              </div>
            </>
          )}

          {aviso && <div className="warning-banner">{aviso}</div>}
        </div>
      )}

      {fase === 'resultado' && resultado && (
        <div className="card" style={{ gap: 20 }}>
          <div className="section-header">Resultado</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div className="stat-card">
              <span className="stat-card-label">Mínima</span>
              <span className="stat-card-value">{resultado.min}<span className="unit">cm</span></span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Promedio</span>
              <span className="stat-card-value">{resultado.prom}<span className="unit">cm</span></span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Máxima</span>
              <span className="stat-card-value">{resultado.max}<span className="unit">cm</span></span>
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
