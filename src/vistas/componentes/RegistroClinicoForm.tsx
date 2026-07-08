'use client';

import React from 'react';
import { RegionKey, LadoKey } from '@/biblioteca/math/angles';
import { TooltipAyuda } from '@/componentes_visuales/TooltipAyuda';
import { User } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
}

interface RegistroClinicoFormProps {
  patients: Patient[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  modo: string;
  setModo: (modo: string) => void;
  region: RegionKey;
  handleRegionChange: (region: RegionKey) => void;
  lado: LadoKey;
  setLado: (lado: LadoKey) => void;
  isRecording: boolean;
  onOpenModal: () => void;
}

const REGION_BOTONES: { key: RegionKey; icono: React.ReactNode; label: string }[] = [
  {
    key: 'CEJA',
    label: 'Ceja',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-indigo-400">
        <path d="M3 13C6 8 9 8 11 10M13 10C15 8 18 8 21 13" />
      </svg>
    )
  },
  {
    key: 'PARPADO',
    label: 'Párpado',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-cyan-400">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3.5" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    key: 'BOCA',
    label: 'Boca',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-450">
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-5-9h10m-10 3q5 4 10 0" />
      </svg>
    )
  },
  {
    key: 'NARIZ',
    label: 'Nariz',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-400">
        <path d="M12 3v12M8 15h8M7 19c2-2 3-2 5-2s3 0 5 2" />
      </svg>
    )
  },
  {
    key: 'CODO',
    label: 'Codo',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-orange-400">
        <path d="M15 18H9a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h3" />
        <circle cx="15" cy="18" r="1" />
      </svg>
    )
  },
  {
    key: 'MUÑECA',
    label: 'Muñeca',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-pink-400">
        <path d="M12 18H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
        <rect x="14" y="12" width="6" height="6" rx="1" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    key: 'HOMBRO',
    label: 'Hombro',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-rose-455">
        <path d="M18 10a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-2Z" />
        <circle cx="12" cy="5" r="2" />
      </svg>
    )
  }
];

/**
 * Presenter Pattern: Formulario modular y desacoplado para el Registro Clínico de pacientes.
 * Mantiene un diseño equilibrado y consistente con los temas claro y oscuro.
 */
export function RegistroClinicoForm({
  patients,
  selectedPatientId,
  setSelectedPatientId,
  modo,
  setModo,
  region,
  handleRegionChange,
  lado,
  setLado,
  isRecording,
  onOpenModal
}: RegistroClinicoFormProps) {
  return (
    <div className="card p-6 flex flex-col gap-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
      <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-200 pb-1 border-b border-zinc-150/40 dark:border-zinc-800/40">
        <User size={18} className="text-indigo-500 dark:text-indigo-400" /> Registro Clínico
        <TooltipAyuda
          posicion="right"
          texto="Complete todos los campos antes de iniciar la grabación. El sistema asociará los datos biomecánicos capturados al perfil del paciente y la configuración seleccionada."
        />
      </h3>

      <div className="flex flex-col gap-4">
        {/* Patient selector */}
        <div className="form-group mb-0">
          <label className="form-label flex items-center justify-between text-zinc-650 dark:text-zinc-300 font-semibold text-xs mb-1.5">
            <span className="flex items-center gap-1">
              Paciente
              <TooltipAyuda
                posicion="right"
                texto="Seleccione el paciente que se evaluará en esta sesión o registre un nuevo perfil clínico."
              />
            </span>
          </label>
          <div className="flex gap-2">
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              className="input-text text-zinc-700 dark:text-zinc-300 py-2 px-3 flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs"
              disabled={isRecording}
            >
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button
              type="button"
              onClick={onOpenModal}
              disabled={isRecording}
              className="btn btn-secondary px-3.5 py-2 text-xs font-bold whitespace-nowrap border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
            >
              + Registrar
            </button>
          </div>
        </div>

        {/* L-DOPA status */}
        <div className="form-group mb-0">
          <label className="form-label flex items-center gap-1 text-zinc-650 dark:text-zinc-300 font-semibold text-xs mb-1.5">
            Estado Fármaco (L-Dopa)
            <TooltipAyuda
              posicion="right"
              texto="Indique si la evaluación se realiza ANTES (PRE) o DESPUÉS (POST) de la administración de Levodopa. Esta distinción es fundamental para comparar la eficacia farmacológica del tratamiento en el tiempo."
            />
          </label>
          <div className="flex border border-zinc-200 dark:border-zinc-850 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950 p-0.5 mt-1">
            <button
              type="button"
              onClick={() => setModo('PRE')}
              disabled={isRecording}
              className={`flex-1 text-[11px] font-bold py-2 px-3 rounded-md transition-all ${
                modo === 'PRE'
                  ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-extrabold shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              PRE (Antes de L-Dopa)
            </button>
            <button
              type="button"
              onClick={() => setModo('POST')}
              disabled={isRecording}
              className={`flex-1 text-[11px] font-bold py-2 px-3 rounded-md transition-all ${
                modo === 'POST'
                  ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              POST (Después de L-Dopa)
            </button>
          </div>
        </div>

        {/* Region selector grid */}
        <div className="form-group mb-0">
          <label className="form-label flex items-center gap-1 text-zinc-650 dark:text-zinc-300 font-semibold text-xs mb-1.5">
            Región de Medición
            <TooltipAyuda
              posicion="top"
              texto="Seleccione el área anatómica a analizar. El sistema calcula el ángulo articular usando landmarks de MediaPipe Face Mesh (rostro) o Pose (cuerpo)."
            />
          </label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {REGION_BOTONES.map(({ key, icono, label }, i) => {
              const isLast = i === REGION_BOTONES.length - 1;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleRegionChange(key)}
                  disabled={isRecording}
                  className={`flex items-center justify-center rounded-lg border text-[11px] font-semibold transition-all ${
                    region === key
                      ? 'bg-indigo-100 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-600/60 text-indigo-650 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/80 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-700 hover:text-zinc-750 dark:hover:text-zinc-400'
                  } ${
                    isLast
                      ? 'col-span-3 flex-row h-10 gap-2.5 py-1 px-4'
                      : 'flex-col gap-1.5 py-2.5 px-1 h-16'
                  }`}
                >
                  <span className="text-lg leading-none shrink-0">{icono}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side selector */}
        <div className="form-group mb-0">
          <label className="form-label flex items-center gap-1 text-zinc-650 dark:text-zinc-300 font-semibold text-xs mb-1.5">
            Lado Facial / Corporal
            <TooltipAyuda
              posicion="top"
              texto="Evalúe ambos lados por separado para calcular el Índice de Asimetría bilateral."
            />
          </label>
          <div className="flex border border-zinc-200 dark:border-zinc-850 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950 p-0.5 mt-1">
            {(['DERECHA', 'IZQUIERDA'] as LadoKey[]).map(l => (
              <button
                type="button"
                key={l}
                onClick={() => setLado(l)}
                disabled={isRecording}
                className={`flex-1 text-[11px] font-bold py-2 px-3 rounded-md transition-all ${
                  lado === l
                    ? 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-655 dark:text-indigo-300 font-extrabold shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {l === 'DERECHA' ? '→ Derecha' : '← Izquierda'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
