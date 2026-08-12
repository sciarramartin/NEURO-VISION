import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Session } from '@/biblioteca/types/database';

interface PatientDetail {
  id: string;
  name: string;
  birth_date: string | null;
}

/**
 * Exports patient's session logs to a professional clinical PDF report.
 */
export function exportarPDF(patient: PatientDetail, sessions: Session[]) {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('es-ES');

  // Title Banner with Emerald Green Theme
  doc.setFillColor(16, 185, 129); // Emerald Green
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('NEURO VISION ANALYTIC', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Evaluación y Seguimiento Facial en Parkinson', 14, 26);
  doc.text(`Fecha Reporte: ${dateStr}`, 155, 26);

  // Patient Info section
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DATOS DEL PACIENTE', 14, 52);
  doc.line(14, 54, 196, 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nombre: ${patient.name}`, 14, 62);
  doc.text(`F. Nacimiento: ${patient.birth_date || 'N/A'}`, 14, 68);
  doc.text(`ID Paciente: ${patient.id}`, 110, 62);

  // Clinical Summary Table header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RESUMEN DE EVALUACIONES FACIALES', 14, 85);
  doc.line(14, 87, 196, 87);

  // Table Columns
  doc.setFontSize(9);
  doc.text('Fecha / Hora', 14, 94);
  doc.text('Modo', 60, 94);
  doc.text('Región', 80, 94);
  doc.text('Lado', 105, 94);
  doc.text('ROM / Promedio', 120, 94);
  doc.text('Velocidad / DBS', 152, 94);
  doc.text('Temblor / RMS', 178, 94);
  doc.line(14, 97, 196, 97);

  doc.setFont('helvetica', 'normal');
  let y = 104;

  sessions.forEach((s) => {
    // Add page if out of bounds
    if (y > 275) {
      doc.addPage();
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, 210, 15, 'F');
      y = 30;
    }

    const date = new Date(s.created_at).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isMarcha = s.region === 'MARCHA';
    const isTemblor = s.region === 'TEMBLOR';

    let romStr = '';
    let velStr = '';
    let tremorStr = '';

    if (isMarcha) {
      romStr = `${s.angulo_promedio.toFixed(1)} cm (Medio)`;
      velStr = `Zancada: ${s.angulo_max.toFixed(1)} cm`;
      tremorStr = 'N/A';
    } else if (isTemblor) {
      romStr = `Amp: ${s.amplitud_temblor?.toFixed(3) || '0.000'} m/s²`;
      let dbsInfo = 'N/A';
      if (s.datos_angulos && s.datos_angulos.startsWith('#DBS:')) {
        const match = s.datos_angulos.match(/#DBS:V=([\d.]+),F=(\d+),W=(\d+);/);
        if (match) {
          dbsInfo = `${match[1]}V/${match[2]}Hz`;
        }
      }
      velStr = `DBS: ${dbsInfo}`;
      tremorStr = s.frecuencia_temblor && s.frecuencia_temblor > 0 
        ? `${s.frecuencia_temblor.toFixed(1)} Hz` 
        : 'S/T';
    } else {
      const romVal = (s.angulo_max - s.angulo_min).toFixed(1);
      romStr = `${romVal}° (${s.angulo_min}°-${s.angulo_max}°)`;
      velStr = `${s.velocidad_max.toFixed(1)}°/s`;
      tremorStr = s.frecuencia_temblor && s.frecuencia_temblor > 0 && s.amplitud_temblor !== null
        ? `${s.frecuencia_temblor.toFixed(1)} Hz (${s.amplitud_temblor.toFixed(1)}°)` 
        : 'S/T';
    }

    doc.text(date, 14, y);
    doc.text(s.modo, 60, y);
    doc.text(s.region, 80, y);
    doc.text(s.lado, 105, y);
    doc.text(romStr, 120, y);
    doc.text(velStr, 152, y);
    doc.text(tremorStr, 178, y);

    y += 8;
  });

  // Disclaimer / Footnote
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    '* Reporte generado de manera autónoma para uso exclusivo del cuerpo clínico. S/T = Sin Temblor.',
    14,
    y + 10
  );

  doc.save(`Reporte_Clinico_${patient.name.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Exports patient's session logs to a multi-sheet Excel spreadsheet.
 */
export function exportarExcel(patient: PatientDetail, sessions: Session[]) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Clinical Summary Data
  const summaryHeaders = [
    ['REPORTE CLÍNICO - NEURO VISION ANALYTIC'],
    [`Paciente: ${patient.name}`],
    [`F. Nacimiento: ${patient.birth_date || 'N/A'}`],
    [`ID Paciente: ${patient.id}`],
    [],
    ['ID Sesión', 'Fecha Registro', 'Estado (Modo)', 'Región', 'Lado', 'ROM / Promedio', 'Valor Mín', 'Valor Máx', 'Velocidad Máx', 'Temblor (Hz)', 'Amplitud Temblor / RMS', 'Parámetros DBS']
  ];

  sessions.forEach((s) => {
    const isMarcha = s.region === 'MARCHA';
    const isTemblor = s.region === 'TEMBLOR';
    
    let romVal = '';
    let minVal = '';
    let maxVal = '';
    let velVal = '';
    let tremorFreq = '0';
    let tremorAmp = '0';
    let dbsParams = 'N/A';

    if (isMarcha) {
      romVal = `${s.angulo_promedio.toFixed(1)} cm`;
      minVal = `${s.angulo_min.toFixed(1)} cm`;
      maxVal = `${s.angulo_max.toFixed(1)} cm`;
      velVal = 'N/A';
    } else if (isTemblor) {
      romVal = 'N/A';
      minVal = 'N/A';
      maxVal = 'N/A';
      velVal = 'N/A';
      tremorFreq = s.frecuencia_temblor ? s.frecuencia_temblor.toString() : '0';
      tremorAmp = s.amplitud_temblor ? s.amplitud_temblor.toString() : '0';
      
      if (s.datos_angulos && s.datos_angulos.startsWith('#DBS:')) {
        const match = s.datos_angulos.match(/#DBS:V=([\d.]+),F=(\d+),W=(\d+);/);
        if (match) {
          dbsParams = `V=${match[1]}, F=${match[2]}Hz, W=${match[3]}us`;
        }
      }
    } else {
      romVal = (s.angulo_max - s.angulo_min).toFixed(1);
      minVal = s.angulo_min.toString();
      maxVal = s.angulo_max.toString();
      velVal = s.velocidad_max.toString();
      tremorFreq = s.frecuencia_temblor ? s.frecuencia_temblor.toString() : '0';
      tremorAmp = s.amplitud_temblor ? s.amplitud_temblor.toString() : '0';
    }

    summaryHeaders.push([
      s.id.slice(0, 8),
      new Date(s.created_at).toLocaleString('es-ES'),
      s.modo,
      s.region,
      s.lado,
      romVal,
      minVal,
      maxVal,
      velVal,
      tremorFreq,
      tremorAmp,
      dbsParams
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryHeaders);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Clinico');

  // Sheet 2+: Raw timeseries coordinates per session
  sessions.forEach((s) => {
    if (!s.datos_angulos) return;

    let cleanAnglesStr = s.datos_angulos;
    if (cleanAnglesStr.startsWith('#DBS:')) {
      const parts = cleanAnglesStr.split(';');
      parts.shift();
      cleanAnglesStr = parts.join(';');
    }

    if (!cleanAnglesStr) return;

    const dataPoints = cleanAnglesStr.split(';');
    const hasBilateral = dataPoints.some(point => point.split(',').length === 3);
    const timeSeriesData = hasBilateral
      ? [['Tiempo (s)', 'Ángulo Activo (°)', 'Ángulo Contralateral (°)']]
      : [['Tiempo (s)', 'Ángulo (°)']];

    dataPoints.forEach((point) => {
      const parts = point.split(',');
      if (parts.length === 2) {
        timeSeriesData.push([parts[0], parts[1]]);
      } else if (parts.length === 3) {
        timeSeriesData.push([parts[0], parts[1], parts[2]]);
      }
    });

    const wsDetails = XLSX.utils.aoa_to_sheet(timeSeriesData);
    // Limit sheet name to 30 chars (Excel restriction)
    const sheetName = `${s.modo}_${s.region}_${s.id.slice(0, 4)}`.slice(0, 30);
    XLSX.utils.book_append_sheet(wb, wsDetails, sheetName);
  });

  XLSX.writeFile(wb, `Datos_Clinicos_${patient.name.replace(/\s+/g, '_')}.xlsx`);
}
