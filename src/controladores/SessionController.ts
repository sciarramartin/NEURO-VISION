import { Session } from '@/modelos/Session';

export class SessionController {
  /**
   * Retrieves sessions filtered optionally by patientId, with an optional limit.
   */
  static async getSessions(patientId?: string, limit?: number) {
    return await Session.find(patientId, limit);
  }

  /**
   * Creates a new session in the database model.
   * Performs validation to ensure patient_id is provided.
   */
  static async createSession(sessionData: any) {
    if (!sessionData || !sessionData.patient_id) {
      throw new Error('Patient ID is required');
    }

    return await Session.create(sessionData);
  }

  /**
   * Deletes a session by its ID.
   * Performs validation to ensure ID is provided.
   */
  static async deleteSession(id: string) {
    if (!id) {
      throw new Error('Session ID is required');
    }

    return await Session.delete(id);
  }
}
