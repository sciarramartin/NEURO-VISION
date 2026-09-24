import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  ContextoUpdrs, Toma, ITEMS_UPDRS3, itemsIncluidos, resumirPuntajes, respuestaLevodopa, ETIQUETAS_GRUPO, GrupoUpdrs,
} from '@/biblioteca/math/updrs';
import { FUENTE_MDS } from '@/biblioteca/instruccionesEvaluador';

export interface DatosInformeUpdrs {
  paciente: string;
  fecha: Date;
  contexto: ContextoUpdrs;
  tomas: Toma<{ puntajeSugerido: number; metricas: Record<string, number>; simulada?: boolean }>[];
  narrativa: string;
  observaciones: string;
}

const MED = { ON: 'ON', OFF: 'OFF', SIN_MEDICACION: 'Sin medicación' } as const;
const DBS = { ON: 'ON', OFF: 'OFF', NO_APLICA: 'No aplica' } as const;

const nombreArchivo = (d: DatosInformeUpdrs, ext: string) =>
  `UPDRS-III_${d.paciente.replace(/[^\p{L}\p{N}]+/gu, '_')}_${d.fecha.toISOString().slice(0, 10)}.${ext}`;

/** Helvetica (WinAnsi) no tiene ≥, →, etc. */
const pdfTxt = (s: string) => s.replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/→/g, '->').replace(/↔/g, '<->').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/·/g, '-');

function filasContexto(d: DatosInformeUpdrs): [string, string][] {
  const c = d.contexto;
  const n = itemsIncluidos(c.itemsExcluidos).length;
  const filas: [string, string][] = [
    ['Paciente', d.paciente],
    ['Fecha', d.fecha.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })],
    ['Modalidad', c.modalidad === 'LEVODOPA' ? 'Test de levodopa' : 'Evaluación única'],
    ['Versión', n === ITEMS_UPDRS3.length ? 'Completa (18 ítems)' : `Personalizada (${n} de 18 ítems)`],
    ...(c.modalidad === 'LEVODOPA' ? [] : [['Medicación', MED[c.medicacion]] as [string, string]]),
    ['Estimulación cerebral profunda', DBS[c.estimulacion]],
  ];
  if (c.modalidad === 'LEVODOPA') {
    filas.push(['Lavado', c.horasLavado !== null ? `${c.horasLavado} h` : '—']);
    filas.push(['Dosis de prueba', c.dosisPruebaMg !== null ? `${c.dosisPruebaMg} mg de levodopa` : '—']);
  } else if (c.minutosUltimaDosis !== null) {
    filas.push(['Minutos desde la última dosis', String(c.minutosUltimaDosis)]);
  }
  return filas;
}

export function exportarUpdrsPDF(d: DatosInformeUpdrs) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 16;
  let y = 0;
  const excl = d.contexto.itemsExcluidos;
  const items = itemsIncluidos(excl);

  const nuevaPagina = () => { doc.addPage(); y = 18; };
  const asegurar = (alto: number) => { if (y + alto > 272) nuevaPagina(); };
  const titulo = (t: string) => {
    asegurar(14);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 20, 20);
    doc.text(pdfTxt(t.toUpperCase()), M, y);
    doc.setDrawColor(16, 185, 129); doc.setLineWidth(0.5); doc.line(M, y + 1.8, M + 18, y + 1.8);
    y += 8;
  };

  // Cabecera
  doc.setFillColor(0, 0, 0); doc.rect(0, 0, W, 26, 'F');
  [0, 1, 2].forEach(i => { doc.setFillColor(16, 185, 129); doc.circle(M + 1.5 + i * 4.2, 11, 1.3, 'F'); });
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text('Informe MDS-UPDRS III', M + 14, 12.5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(190, 190, 190);
  doc.text('Neuro Vision Analytic - examen motor', M + 14, 18.5);
  y = 36;

  titulo('Datos de la evaluación');
  doc.setFontSize(9);
  filasContexto(d).forEach(([k, v]) => {
    doc.setFont('helvetica', 'normal'); doc.setTextColor(110, 110, 110); doc.text(pdfTxt(k), M, y);
    doc.setTextColor(20, 20, 20); doc.text(pdfTxt(v), M + 58, y); y += 5.2;
  });
  y += 4;

  // Resumen por toma
  titulo(d.contexto.modalidad === 'LEVODOPA' ? 'Resultados por toma' : 'Resultado');
  const grupos = Object.keys(ETIQUETAS_GRUPO) as GrupoUpdrs[];
  const resp = respuestaLevodopa(d.tomas, excl);
  const cols = ['Toma', 'Total', ...(d.contexto.modalidad === 'LEVODOPA' ? ['Mejoría'] : []), ...grupos.map(g => ETIQUETAS_GRUPO[g])];
  const anchoCol = (W - 2 * M) / cols.length;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(110, 110, 110);
  cols.forEach((c, i) => doc.text(pdfTxt(c), M + i * anchoCol, y, { maxWidth: anchoCol - 2 }));
  y += 6; doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2); doc.line(M, y - 3.5, W - M, y - 3.5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(20, 20, 20);
  d.tomas.forEach(t => {
    const r = resumirPuntajes(t.puntajes, excl);
    const mej = resp?.porToma.find(x => x.id === t.id)?.mejoria;
    const valores = [
      t.etiqueta, `${r.total}/${r.maximo}${r.completos < r.esperados ? ' *' : ''}`,
      ...(d.contexto.modalidad === 'LEVODOPA' ? [mej !== null && mej !== undefined ? `${mej.toFixed(1)} %` : '—'] : []),
      ...grupos.map(g => (r.maximoPorGrupo[g] ? `${r.porGrupo[g]}/${r.maximoPorGrupo[g]}` : '—')),
    ];
    asegurar(6);
    valores.forEach((v, i) => doc.text(pdfTxt(v), M + i * anchoCol, y));
    y += 5.5;
  });
  if (d.tomas.some(t => { const r = resumirPuntajes(t.puntajes, excl); return r.completos < r.esperados; })) {
    doc.setFontSize(7); doc.setTextColor(120, 120, 120); doc.text('* toma incompleta', M, y); y += 4;
  }
  if (resp?.mejoria !== null && resp?.mejoria !== undefined) {
    y += 2; doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 20, 20);
    doc.text(pdfTxt(`Respuesta a levodopa: ${resp.mejoria.toFixed(1)} % (mejor ON: ${resp.mejorOn?.etiqueta}) — ${resp.positiva ? 'POSITIVA' : 'NEGATIVA'} (umbral >= 33 %)`), M, y);
    y += 7;
  }
  y += 3;

  // Narrativa
  titulo('Informe narrativo');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(20, 20, 20);
  const lineas = doc.splitTextToSize(pdfTxt(d.narrativa || '—'), W - 2 * M) as string[];
  lineas.forEach(l => { asegurar(5); doc.text(l, M, y); y += 4.6; });
  if (d.observaciones.trim()) {
    y += 2; doc.setFont('helvetica', 'bold'); doc.text('Observaciones', M, y); y += 5; doc.setFont('helvetica', 'normal');
    (doc.splitTextToSize(pdfTxt(d.observaciones), W - 2 * M) as string[]).forEach(l => { asegurar(5); doc.text(l, M, y); y += 4.6; });
  }
  y += 5;

  // Detalle por ítem
  titulo('Detalle por ítem');
  const colT = Math.min(22, (W - 2 * M - 90) / Math.max(1, d.tomas.length));
  const cabecera = () => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(110, 110, 110);
    doc.text('Ítem', M, y);
    d.tomas.forEach((t, i) => doc.text(pdfTxt(t.etiqueta), M + 90 + i * colT, y, { maxWidth: colT - 1 }));
    y += 5; doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(20, 20, 20);
  };
  cabecera();
  items.forEach(item => {
    item.subitems.forEach(s => {
      if (y > 272) { nuevaPagina(); cabecera(); }
      const etiqueta = `${item.numero} ${item.nombre}${s.etiqueta ? ` — ${s.etiqueta}` : ''}`;
      doc.text(pdfTxt(etiqueta), M, y, { maxWidth: 88 });
      d.tomas.forEach((t, i) => {
        const v = t.puntajes[s.id];
        const cam = t.mediciones[s.id];
        doc.text(v === undefined ? '—' : `${v}${cam ? ' c' : ''}`, M + 90 + i * colT, y);
      });
      y += 4.8;
    });
  });
  doc.setFontSize(7); doc.setTextColor(120, 120, 120); y += 1;
  doc.text('c = medido con cámara (puntaje confirmado por el evaluador)', M, y); y += 6;

  // Pie en todas las páginas
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5); doc.setTextColor(140, 140, 140);
    const pie = doc.splitTextToSize(pdfTxt(FUENTE_MDS), W - 2 * M - 20) as string[];
    pie.forEach((l, k) => doc.text(l, M, 287 + k * 2.8 - (pie.length - 1) * 2.8));
    doc.text(`${i}/${n}`, W - M, 287, { align: 'right' });
  }

  doc.save(nombreArchivo(d, 'pdf'));
}

export function exportarUpdrsExcel(d: DatosInformeUpdrs) {
  const excl = d.contexto.itemsExcluidos;
  const wb = XLSX.utils.book_new();
  const grupos = Object.keys(ETIQUETAS_GRUPO) as GrupoUpdrs[];
  const resp = respuestaLevodopa(d.tomas, excl);

  const resumen: (string | number | null)[][] = [['Informe MDS-UPDRS III — Neuro Vision Analytic'], [], ...filasContexto(d), []];
  resumen.push(['Toma', 'Total', 'Máximo', 'Completas', 'Esperadas', 'Mejoría vs OFF (%)', ...grupos.map(g => ETIQUETAS_GRUPO[g]), 'Hoehn y Yahr', 'Discinesias', 'Interfirieron']);
  d.tomas.forEach(t => {
    const r = resumirPuntajes(t.puntajes, excl);
    const mej = resp?.porToma.find(x => x.id === t.id)?.mejoria;
    resumen.push([
      t.etiqueta, r.total, r.maximo, r.completos, r.esperados, mej !== null && mej !== undefined ? +mej.toFixed(1) : null,
      ...grupos.map(g => r.porGrupo[g]), t.hoehnYahr ?? '',
      t.discinesiasPresentes === null ? '' : t.discinesiasPresentes ? 'Sí' : 'No',
      t.discinesiasInterfirieron === null ? '' : t.discinesiasInterfirieron ? 'Sí' : 'No',
    ]);
  });
  if (resp?.mejoria !== null && resp?.mejoria !== undefined) {
    resumen.push([], ['Respuesta a levodopa (%)', +resp.mejoria.toFixed(1)], ['Mejor ON', resp.mejorOn?.etiqueta ?? ''], ['Resultado', resp.positiva ? 'Positiva (≥ 33 %)' : 'Negativa (< 33 %)']);
  }
  const hResumen = XLSX.utils.aoa_to_sheet(resumen);
  hResumen['!cols'] = [{ wch: 30 }, { wch: 22 }, ...Array(14).fill({ wch: 13 })];
  XLSX.utils.book_append_sheet(wb, hResumen, 'Resumen');

  const detalle: (string | number | null)[][] = [['Ítem', 'Nombre', 'Segmento', 'Dominio', ...d.tomas.map(t => t.etiqueta)]];
  itemsIncluidos(excl).forEach(item => item.subitems.forEach(s => {
    detalle.push([item.numero, item.nombre, s.etiqueta || '—', ETIQUETAS_GRUPO[item.grupo], ...d.tomas.map(t => t.puntajes[s.id] ?? null)]);
  }));
  const hDet = XLSX.utils.aoa_to_sheet(detalle);
  hDet['!cols'] = [{ wch: 7 }, { wch: 36 }, { wch: 18 }, { wch: 18 }, ...d.tomas.map(() => ({ wch: 12 }))];
  XLSX.utils.book_append_sheet(wb, hDet, 'Ítems');

  const med: (string | number | null)[][] = [['Toma', 'Puntuación', 'Puntaje sugerido', 'Puntaje confirmado', 'Simulada', 'Métrica', 'Valor']];
  d.tomas.forEach(t => Object.entries(t.mediciones).forEach(([id, m]) => {
    Object.entries(m.metricas).forEach(([k, v], i) => {
      med.push(i === 0 ? [t.etiqueta, id, m.puntajeSugerido, t.puntajes[id] ?? null, m.simulada ? 'Sí' : 'No', k, v] : ['', '', null, null, '', k, v]);
    });
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(med), 'Mediciones cámara');

  const inf = XLSX.utils.aoa_to_sheet([['Informe narrativo'], [d.narrativa], [], ['Observaciones'], [d.observaciones], [], ['Fuente'], [FUENTE_MDS]]);
  inf['!cols'] = [{ wch: 120 }];
  XLSX.utils.book_append_sheet(wb, inf, 'Informe');

  XLSX.writeFile(wb, nombreArchivo(d, 'xlsx'));
}
