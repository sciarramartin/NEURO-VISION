'use client';

import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';

interface NuevoPacienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<any>;
}

export function NuevoPacienteModal({ isOpen, onClose, onCreate }: NuevoPacienteModalProps) {
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
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="section-header">
          <UserPlus size={15} style={{ color: 'var(--accent)' }} />
          Registrar Nuevo Paciente
          <button onClick={onClose} style={{ marginLeft: 'auto', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 12 }}>
          <div className="form-group">
            <label className="form-label">Nombre Completo</label>
            <input type="text" required value={newPatientName} onChange={e => setNewPatientName(e.target.value)} placeholder="Ej. Juan Pérez" className="input-text" autoFocus />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border-card)' }}>
            <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary" style={{ fontSize: 11, padding: '7px 14px' }}>Cancelar</button>
            <button type="submit" disabled={loading || !newPatientName.trim()} className="btn btn-primary" style={{ fontSize: 11, padding: '7px 14px' }}>
              {loading ? 'Creando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
