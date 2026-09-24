import { NextResponse } from 'next/server';
import { EvaluacionController } from '@/controladores/EvaluacionController';

export const dynamic = 'force-dynamic';

const mensaje = (err: unknown) => (err instanceof Error ? err.message : String(err));
const esValidacion = (m: string) => /required|inválid|obligatorio/i.test(m);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rows = await EvaluacionController.getEvaluaciones(
      searchParams.get('patientId') || undefined,
      searchParams.get('tipo') || undefined
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error('API Evaluaciones GET error:', err);
    return NextResponse.json({ error: mensaje(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const nueva = await EvaluacionController.createEvaluacion(await request.json());
    return NextResponse.json(nueva);
  } catch (err) {
    const m = mensaje(err);
    console.error('API Evaluaciones POST error:', err);
    return NextResponse.json({ error: m }, { status: esValidacion(m) ? 400 : 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Evaluacion ID is required' }, { status: 400 });
    await EvaluacionController.deleteEvaluacion(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API Evaluaciones DELETE error:', err);
    return NextResponse.json({ error: mensaje(err) }, { status: 500 });
  }
}
