'use client';

import dynamic from 'next/dynamic';

// Sólo cliente: la vista usa cámara, WASM y restaura un borrador desde sessionStorage.
const UpdrsView = dynamic(() => import('@/vistas/analisis/updrs/UpdrsView').then(m => m.UpdrsView), { ssr: false });

export default function UpdrsPage() {
  return <UpdrsView />;
}
