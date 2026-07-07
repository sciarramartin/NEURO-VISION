import { getDB } from '@/biblioteca/db';
import { Session as DatabaseSession } from '@/biblioteca/types/database';

export class Session {
  /**
   * Fetch all sessions or filter by patient.
   */
  static async find(patientId?: string, limit?: number): Promise<DatabaseSession[]> {
    const db = await getDB();
    return await db.getSessions(patientId, limit);
  }

  /**
   * Create a new session.
   */
  static async create(sessionData: any): Promise<DatabaseSession> {
    const db = await getDB();
    return await db.createSession(sessionData);
  }

  /**
   * Delete a session by ID.
   */
  static async delete(id: string): Promise<{ success: boolean }> {
    const db = await getDB();
    return await db.deleteSession(id);
  }
}
