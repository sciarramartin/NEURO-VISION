import { Evaluacion } from '@/modelos/Evaluacion';

const TIPOS_VALIDOS = ['UPDRS_III'];
const MODOS_VALIDOS = ['PRE', 'POST'];

export class EvaluacionController {
  static async getEvaluaciones(patientId?: string, tipo?: string) {
    return Evaluacion.find(patientId, tipo);
  }

  /** Valida la forma mínima antes de persistir una evaluación estructurada. */
  static async createEvaluacion(body: Record<string, unknown> | null) {
    if (!body || typeof body.patient_id !== 'string' || !body.patient_id) throw new Error('Patient ID is required');
    if (typeof body.tipo !== 'string' || !TIPOS_VALIDOS.includes(body.tipo)) throw new Error(`Tipo de evaluación inválido: ${body.tipo}`);
    if (typeof body.modo !== 'string' || !MODOS_VALIDOS.includes(body.modo)) throw new Error(`Modo inválido: ${body.modo}`);
    if (body.datos === undefined || body.datos === null || typeof body.datos !== 'object') throw new Error('datos es obligatorio');
    const total = body.puntaje_total;
    return Evaluacion.create({
      patient_id: body.patient_id,
      tipo: body.tipo,
      modo: body.modo,
      puntaje_total: typeof total === 'number' && Number.isFinite(total) ? total : null,
      datos: body.datos,
    });
  }

  static async deleteEvaluacion(id: string) {
    if (!id) throw new Error('Evaluacion ID is required');
    return Evaluacion.delete(id);
  }
}
