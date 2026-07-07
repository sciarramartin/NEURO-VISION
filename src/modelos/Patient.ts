import { getDB } from '@/biblioteca/db';

export interface PatientData {
  id: string;
  name: string;
  birth_date: string | null;
  created_at?: string;
  sessions_count?: number;
}

export class Patient {
  /**
   * Fetch all patients.
   */
  static async all(): Promise<PatientData[]> {
    const db = await getDB();
    return await db.getPatients();
  }

  /**
   * Create a new patient.
   */
  static async create(name: string, birthDate?: string): Promise<PatientData> {
    const db = await getDB();
    return await db.createPatient(name, birthDate);
  }
}
