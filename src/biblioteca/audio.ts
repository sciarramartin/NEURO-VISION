/**
 * Utilidad mínima de audio (Web Audio API) para las señales sonoras de
 * inicio/fin de las capturas guiadas de 7 segundos (goniómetro, análisis
 * facial). No depende de archivos externos ni de librerías: genera un tono
 * corto en el navegador. Falla en silencio si el navegador bloquea el
 * audio (por ejemplo, sin interacción previa del usuario).
 */
let ctxSingleton: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctxSingleton) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxSingleton = new AC();
    }
    if (ctxSingleton.state === 'suspended') ctxSingleton.resume().catch(() => {});
    return ctxSingleton;
  } catch {
    return null;
  }
}

export function reproducirTono(frecuenciaHz: number, duracionMs: number = 180, volumen: number = 0.08) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frecuenciaHz;
    gain.gain.value = volumen;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volumen, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duracionMs / 1000);
    osc.start(now);
    osc.stop(now + duracionMs / 1000);
  } catch {
    /* noop */
  }
}

export const tonoInicio = () => reproducirTono(880, 150);
export const tonoFin = () => reproducirTono(440, 260);
