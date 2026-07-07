import { NextResponse } from 'next/server';
import { SessionController } from '@/controladores/SessionController';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId') || undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;

    const sessions = await SessionController.getSessions(patientId, limit);
    return NextResponse.json(sessions);
  } catch (err: any) {
    console.error('API Sessions GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionData = await request.json();
    const newSession = await SessionController.createSession(sessionData);
    return NextResponse.json(newSession);
  } catch (err: any) {
    console.error('API Sessions POST error:', err);
    
    if (err.message === 'Patient ID is required') {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    await SessionController.deleteSession(id);
    return NextResponse.json({ success: true, message: 'Session deleted successfully' });
  } catch (err: any) {
    console.error('API Sessions DELETE error:', err);
    
    if (err.message === 'Session ID is required') {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
