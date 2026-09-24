'use client';

import dynamic from 'next/dynamic';

// Sólo cliente: cámara, WASM y borrador en sessionStorage.
const ProgramacionDbsView = dynamic(() => import('@/vistas/analisis/dbs/ProgramacionDbsView').then(m => m.ProgramacionDbsView), { ssr: false });

export default function ProgramacionDbsPage() {
  return <ProgramacionDbsView />;
}
