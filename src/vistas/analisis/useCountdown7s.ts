'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { tonoInicio, tonoFin } from '@/biblioteca/audio';

export type FaseCaptura = 'lista' | 'grabando' | 'finalizada';

interface UseCountdown7sOptions {
  duracionMs?: number;
  onIniciar: () => void;
  onFinalizar: () => void;
}

/**
 * Cuenta regresiva fija (por defecto 7000 ms) para las capturas guiadas de
 * goniómetro y análisis facial: al presionar "Iniciar" suena un tono,
 * arranca la grabación (onIniciar), se anima un anillo de progreso y, al
 * cumplirse el tiempo, suena un segundo tono y se detiene automáticamente
 * (onFinalizar) — el usuario no tiene que cronometrar nada a mano.
 */
export function useCountdown7s({ duracionMs = 7000, onIniciar, onFinalizar }: UseCountdown7sOptions) {
  const [fase, setFase] = useState<FaseCaptura>('lista');
  const [msRestantes, setMsRestantes] = useState(duracionMs);
  const rafRef = useRef<number | null>(null);
  const finRef = useRef<number>(0);
  const onFinalizarRef = useRef(onFinalizar);
  const tickRef = useRef<() => void>(() => {});

  useEffect(() => { onFinalizarRef.current = onFinalizar; }, [onFinalizar]);

  useEffect(() => {
    tickRef.current = () => {
      const restante = Math.max(0, finRef.current - performance.now());
      setMsRestantes(restante);
      if (restante <= 0) {
        setFase('finalizada');
        tonoFin();
        onFinalizarRef.current();
        return;
      }
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    };
  });

  const iniciar = useCallback(() => {
    setFase('grabando');
    setMsRestantes(duracionMs);
    finRef.current = performance.now() + duracionMs;
    tonoInicio();
    onIniciar();
    rafRef.current = requestAnimationFrame(() => tickRef.current());
  }, [duracionMs, onIniciar]);

  const reiniciar = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setFase('lista');
    setMsRestantes(duracionMs);
  }, [duracionMs]);

  /** Termina la captura antes de tiempo (p. ej. la marcha ya salió de cuadro). */
  const detener = useCallback(() => { finRef.current = performance.now(); }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const segundos = Math.ceil(msRestantes / 1000);
  const progreso = 1 - msRestantes / duracionMs; // 0 -> 1

  return { fase, segundos, progreso, iniciar, reiniciar, detener };
}
