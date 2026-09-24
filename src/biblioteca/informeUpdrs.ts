import {
  ContextoUpdrs, Toma, GrupoUpdrs, resumirPuntajes, respuestaLevodopa, itemsIncluidos, ITEMS_UPDRS3,
  UMBRAL_RESPUESTA_LEVODOPA, ResumenUpdrs,
} from '@/biblioteca/math/updrs';

/**
 * Texto narrativo para la historia clínica, generado a partir de los datos
 * cargados. Es un BORRADOR editable: el médico lo revisa antes de copiarlo.
 * No afirma nada que no se haya registrado (p. ej. tolerancia sistémica).
 */

const f1 = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');

function predominio(r: ResumenUpdrs): string | null {
  const m = r.maximoPorGrupo, g = r.porGrupo;
  const frac = (num: number, den: number) => (den > 0 ? num / den : 0);
  const candidatos = [
    { t: 'rígido-acinético', v: frac(g.rigidez + g.bradicinesia, m.rigidez + m.bradicinesia) },
    { t: 'temblor', v: frac(g.temblor, m.temblor) },
    { t: 'compromiso axial y de la marcha', v: frac(g.axial, m.axial) },
  ].filter(c => c.v > 0);
  if (!candidatos.length) return null;
  const max = Math.max(...candidatos.map(c => c.v));
  const top = candidatos.filter(c => c.v >= max * 0.8).map(c => c.t);
  const lista = top.length > 1 ? `${top.slice(0, -1).join(', ')} y ${top[top.length - 1]}` : top[0];
  return `predominio ${lista}`;
}

function nombreEscala(ctx: ContextoUpdrs, r: ResumenUpdrs): string {
  const n = itemsIncluidos(ctx.itemsExcluidos).length;
  return n === ITEMS_UPDRS3.length ? 'MDS-UPDRS III' : `MDS-UPDRS III parcial (${n} de ${ITEMS_UPDRS3.length} ítems, máx. ${r.maximo})`;
}

const txtDisc = (t: Toma) =>
  t.discinesiasPresentes === true ? `, con discinesias${t.discinesiasInterfirieron ? ' que interfirieron con la evaluación' : ''}`
    : t.discinesiasPresentes === false ? ', sin discinesias' : '';

const txtIncompleta = (r: ResumenUpdrs) => (r.completos < r.esperados ? ` [incompleta: ${r.esperados - r.completos} puntuaciones sin completar]` : '');

export interface PreviaUpdrs { fecha: string; total: number }

export function generarNarrativa(ctx: ContextoUpdrs, tomas: Toma[], previaPre?: PreviaUpdrs | null, modo?: string): string {
  if (ctx.modalidad === 'LEVODOPA') return narrativaLevodopa(ctx, tomas);

  const t = tomas[0];
  const r = resumirPuntajes(t.puntajes, ctx.itemsExcluidos);
  const estado = ctx.medicacion === 'SIN_MEDICACION' ? 'sin medicación antiparkinsoniana' : `en ${ctx.medicacion} de medicación`;
  const dbs = ctx.estimulacion === 'NO_APLICA' ? '' : `, estimulación cerebral profunda ${ctx.estimulacion}`;
  const dosis = ctx.minutosUltimaDosis !== null && ctx.medicacion !== 'SIN_MEDICACION' ? `, a los ${ctx.minutosUltimaDosis} min de la última dosis de levodopa` : '';
  const pred = predominio(r);
  const partes: string[] = [];
  partes.push(`Paciente evaluado ${estado}${dbs}${dosis}. Puntaje ${nombreEscala(ctx, r)}: ${r.total}/${r.maximo}${pred ? ` (${pred})` : ''}${txtIncompleta(r)}.`);
  const sub = (Object.keys(r.porGrupo) as GrupoUpdrs[])
    .filter(g => r.maximoPorGrupo[g] > 0)
    .map(g => `${ETQ[g]} ${r.porGrupo[g]}/${r.maximoPorGrupo[g]}`);
  if (sub.length) partes.push(`Subpuntajes: ${sub.join('; ')}.`);
  if (r.asimetria !== null && Math.abs(r.asimetria) >= 10) {
    partes.push(`Asimetría motora ${r.asimetria > 0 ? 'a predominio derecho' : 'a predominio izquierdo'} (hemicuerpo derecho ${r.derecha} vs. izquierdo ${r.izquierda}).`);
  }
  const extra = [t.hoehnYahr ? `Hoehn y Yahr ${t.hoehnYahr}` : null, txtDisc(t).replace(/^, /, '') || null].filter(Boolean);
  if (extra.length) partes.push(`${extra.join('; ')}.`.replace(/^./, c => c.toUpperCase()));
  if (modo === 'POST' && previaPre && previaPre.total > 0) {
    const pct = ((previaPre.total - r.total) / previaPre.total) * 100;
    partes.push(`Respecto de la evaluación PRE del ${previaPre.fecha} (${previaPre.total}), presenta ${pct >= 0 ? 'una mejoría' : 'un empeoramiento'} del ${f1(Math.abs(pct))} %.`);
  }
  partes.push('Reporte desglosado adjunto.');
  return partes.join(' ');
}

const ETQ: Record<GrupoUpdrs, string> = {
  global: 'lenguaje/facial', rigidez: 'rigidez', bradicinesia: 'bradicinesia', axial: 'axial/marcha', temblor: 'temblor',
};

function narrativaLevodopa(ctx: ContextoUpdrs, tomas: Toma[]): string {
  const resp = respuestaLevodopa(tomas, ctx.itemsExcluidos);
  const off = tomas.find(t => t.estado === 'OFF');
  if (!off || !resp) return '';
  const rOff = resumirPuntajes(off.puntajes, ctx.itemsExcluidos);
  const max = rOff.maximo;
  const pred = predominio(rOff);
  const lavado = ctx.horasLavado ? ` tras ${ctx.horasLavado} h de lavado` : '';
  const dbs = ctx.estimulacion === 'NO_APLICA' ? '' : ` (estimulación cerebral profunda ${ctx.estimulacion})`;
  const dosis = ctx.dosisPruebaMg ? ` (levodopa ${ctx.dosisPruebaMg} mg)` : '';
  const p: string[] = [];

  p.push(`Paciente evaluado mediante test de levodopa${lavado}${dbs}. En OFF basal presenta un puntaje ${nombreEscala(ctx, rOff)} de ${rOff.total}/${max}${pred ? ` (${pred})` : ''}${txtIncompleta(rOff)}.`);

  const ons = tomas.filter(t => t.estado === 'ON' && resumirPuntajes(t.puntajes, ctx.itemsExcluidos).completos > 0);
  if (!ons.length || !resp.mejorOn || resp.mejoria === null) {
    p.push('Aún no se registraron evaluaciones en ON.');
    return p.join(' ');
  }
  if (ons.length > 1) {
    const serie = ons.map(t => {
      const r = resumirPuntajes(t.puntajes, ctx.itemsExcluidos);
      const pt = resp.porToma.find(x => x.id === t.id)?.mejoria;
      return `${t.minutos ?? '?'} min ${r.total}/${max}${pt !== null && pt !== undefined ? ` (${f1(pt)} %)` : ''}`;
    });
    p.push(`Tras la dosis de prueba${dosis} se registraron: ${serie.join('; ')}.`);
  }
  const mejor = tomas.find(t => t.id === resp.mejorOn!.id)!;
  const rMejor = resumirPuntajes(mejor.puntajes, ctx.itemsExcluidos);
  p.push(`${ons.length > 1 ? 'El mejor estado ON se alcanza' : 'Alcanza un estado ON'} a los ${mejor.minutos ?? '?'} min${ons.length > 1 ? '' : ` post-dosis de prueba${dosis}`}, con un puntaje de ${rMejor.total}/${max}${txtDisc(mejor)}${txtIncompleta(rMejor)}.`);

  const pos = resp.mejoria >= UMBRAL_RESPUESTA_LEVODOPA;
  let concl = `Conclusión: test de levodopa ${pos ? 'positivo' : 'negativo'}, con una mejoría motora del ${f1(resp.mejoria)} % (umbral de referencia ≥ ${UMBRAL_RESPUESTA_LEVODOPA} %).`;
  concl += pos
    ? ' La magnitud de la respuesta indica una reserva dopaminérgica conservada; en el contexto clínico, apoya el diagnóstico de enfermedad de Parkinson idiopática y respalda la evaluación para terapias de neuromodulación (DBS).'
    : ' La respuesta es inferior al umbral habitual para considerar neuromodulación (DBS); correlacionar con la clínica.';
  const tr = resp.porGrupo.temblor;
  if (tr !== null && rOff.porGrupo.temblor >= 4 && tr < resp.mejoria - 15) {
    concl += ` El temblor mostró una respuesta menor (${f1(tr)} %).`;
  }
  p.push(concl);
  p.push('Reporte desglosado adjunto.');
  return p.join(' ');
}
