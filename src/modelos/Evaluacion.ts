import { getDB, EvaluacionRow, NuevaEvaluacion } from '@/biblioteca/db';

export class Evaluacion {
  static async find(patientId?: string, tipo?: string): Promise<EvaluacionRow[]> {
    const db = await getDB();
    return db.getEvaluaciones(patientId, tipo);
  }

  static async create(data: NuevaEvaluacion): Promise<EvaluacionRow> {
    const db = await getDB();
    return db.createEvaluacion(data);
  }

  static async delete(id: string): Promise<{ success: boolean }> {
    const db = await getDB();
    return db.deleteEvaluacion(id);
  }
}
