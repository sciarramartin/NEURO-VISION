import { NextResponse } from 'next/server';
import { PatientController } from '@/controladores/PatientController';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const patients = await PatientController.getPatients();
    return NextResponse.json(patients);
  } catch (err: any) {
    console.error('API Patients GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, birth_date } = await request.json();
    const newPatient = await PatientController.createPatient(name, birth_date);
    return NextResponse.json(newPatient);
  } catch (err: any) {
    console.error('API Patients POST error:', err);
    
    // Check if error is validation error (e.g. name required) to return a 400 Bad Request
    if (err.message === 'Name is required') {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
