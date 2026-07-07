import { Patient } from '@/modelos/Patient';

export class PatientController {
  /**
   * Retrieves all patients from the database model.
   */
  static async getPatients() {
    return await Patient.all();
  }

  /**
   * Creates a new patient.
   * Performs validation to ensure name is provided.
   */
  static async createPatient(name: string, birth_date?: string) {
    if (!name || !name.trim()) {
      throw new Error('Name is required');
    }

    return await Patient.create(name.trim(), birth_date);
  }
}
