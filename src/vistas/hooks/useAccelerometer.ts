'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DataInercial, analizarTemblor, TremorAnalysis } from '@/biblioteca/math/fft';

export function useAccelerometer(isMockMode: boolean = true) {
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [data, setData] = useState<DataInercial[]>([]);
  const [latestReading, setLatestReading] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 9.8, z: 0 });

  const dataRef = useRef<DataInercial[]>([]);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startCapture = useCallback(() => {
    setData([]);
    dataRef.current = [];
    startTimeRef.current = performance.now();
    setIsCapturing(true);

    if (isMockMode) {
      // Modo Simulado: Genera oscilaciones rítmicas a ~5.4 Hz (frecuencia típica del temblor Parkinson)
      let count = 0;
      captureIntervalRef.current = setInterval(() => {
        const t = (performance.now() - startTimeRef.current) / 1000;
        
        // Señal de temblor: componente de 5.4 Hz y armónico menor de 10.8 Hz
        const tremorX = 1.2 * Math.sin(2 * Math.PI * 5.4 * t) + 0.3 * Math.random();
        const tremorY = 0.8 * Math.cos(2 * Math.PI * 5.4 * t) + 0.2 * Math.random();
        const tremorZ = 9.8 + 0.5 * Math.sin(2 * Math.PI * 10.8 * t) + 0.2 * Math.random(); // Eje Z con gravedad

        const newSample = { tiempo: t, x: tremorX, y: tremorY, z: tremorZ };
        dataRef.current.push(newSample);
        setLatestReading({ x: tremorX, y: tremorY, z: tremorZ });
        count++;

        // Actualizar estado en UI cada 5 muestras para eficiencia de render
        if (count % 5 === 0) {
          setData([...dataRef.current]);
        }
      }, 20); // ~50 Hz de frecuencia de muestreo
    } else {
      // Modo Real: Escucha eventos físicos de DeviceMotionEvent
      const handleMotion = (event: DeviceMotionEvent) => {
        if (!isCapturing) return;
        const accel = event.accelerationIncludingGravity;
        if (!accel) return;

        const t = (performance.now() - startTimeRef.current) / 1000;
        const x = accel.x ?? 0;
        const y = accel.y ?? 0;
        const z = accel.z ?? 0;

        const newSample = { tiempo: t, x, y, z };
        dataRef.current.push(newSample);
        setLatestReading({ x, y, z });

        // Throttle updates to state
        if (dataRef.current.length % 5 === 0) {
          setData([...dataRef.current]);
        }
      };

      // Solicitar permisos en dispositivos iOS si es necesario
      if (
        typeof window !== 'undefined' &&
        typeof (DeviceMotionEvent as any).requestPermission === 'function'
      ) {
        (DeviceMotionEvent as any)
          .requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              window.addEventListener('devicemotion', handleMotion);
            }
          })
          .catch(console.error);
      } else if (typeof window !== 'undefined') {
        window.addEventListener('devicemotion', handleMotion);
      }

      // Guardar callback de remoción en una referencia o closure para limpiar luego
      (startCapture as any)._cleanup = () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('devicemotion', handleMotion);
        }
      };
    }
  }, [isMockMode, isCapturing]);

  const stopCapture = useCallback((): TremorAnalysis => {
    setIsCapturing(false);
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    if ((startCapture as any)._cleanup) {
      (startCapture as any)._cleanup();
      delete (startCapture as any)._cleanup;
    }

    const finalData = [...dataRef.current];
    setData(finalData);

    // Ejecutar el análisis matemático de temblor por FFT
    return analizarTemblor(finalData);
  }, [startCapture]);

  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      if ((startCapture as any)._cleanup) (startCapture as any)._cleanup();
    };
  }, [startCapture]);

  return {
    isCapturing,
    startCapture,
    stopCapture,
    latestReading,
    capturedSamplesCount: data.length,
    rawSeries: data
  };
}
