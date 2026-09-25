/**
 * Paso de build: sincroniza el esquema de Prisma con la base SÓLO si hay
 * una base configurada (DATABASE_URL o POSTGRES_URL). Sin base (p. ej. un
 * deploy de demostración en Vercel) se omite y la app usa el almacenamiento
 * en memoria de src/biblioteca/db.ts, en vez de hacer fallar el build.
 */
import { execSync } from 'node:child_process';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.log('[build] Sin DATABASE_URL: se omite "prisma db push" (modo demostración, datos en memoria).');
} else {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
}
