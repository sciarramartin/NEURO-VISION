'use client';

import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';

interface NuevoPacienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<any>;
}

/**
 * Presenter Pattern: Cuadro de diálogo modal modular para agregar
 * rápidamente nuevos perfiles de pacientes evaluados.
 * 
 * Ergonomía: Paddings y espaciados ergonómicos internos (anti text-to-border)
 * con fondo translúcido y acoplado al tema claro/oscuro.
 */
export function NuevoPacienteModal({
  isOpen,
  onClose,
  onCreate
}: NuevoPacienteModalProps) {
  const [newPatientName, setNewPatientName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;
    setLoading(true);
    try {
      await onCreate(newPatientName.trim());
      setNewPatientName('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 flex flex-col gap-4 animate-scale-up">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-zinc-150 dark:border-zinc-800/40">
          <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <UserPlus size={18} className="text-indigo-500" /> Registrar Nuevo Paciente
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group mb-0">
            <label className="form-label text-zinc-650 dark:text-zinc-300 font-semibold text-xs mb-1.5 block">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={newPatientName}
              onChange={e => setNewPatientName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="input-text text-zinc-700 dark:text-zinc-200 w-full py-2.5 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
              autoFocus
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t border-zinc-150 dark:border-zinc-800/40">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !newPatientName.trim()}
              className="px-4 py-2 text-xs font-bold bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
