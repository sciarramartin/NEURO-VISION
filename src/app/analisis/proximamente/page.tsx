'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Hourglass } from 'lucide-react';

function ProximamenteContent() {
  const params = useSearchParams();
  const modulo = params.get('modulo') ?? 'Este módulo';

  return (
    <div className="main-content" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <div className="card" style={{ alignItems: 'center', textAlign: 'center', maxWidth: 420, gap: 20, padding: 40 }}>
        <div className="empty-state-ring" style={{ width: 56, height: 56 }}>
          <Hourglass size={24} />
        </div>
        <div>
          <h2 style={{ marginBottom: 6 }}>{modulo}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Próximamente, aún no se desarrollaron estas funciones.
          </p>
        </div>
        <Link href="/" className="btn btn-secondary">
          <ArrowLeft size={14} /> Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default function ProximamentePage() {
  return (
    <Suspense fallback={null}>
      <ProximamenteContent />
    </Suspense>
  );
}
