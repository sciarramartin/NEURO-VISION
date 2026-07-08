'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { RegionKey, LadoKey, PUNTOS_MEDICION } from '@/biblioteca/math/angles';

/**
 * ViewModel Pattern: Custom hook encargado de aislar y controlar reactivamente
 * el ciclo de vida de la grabación, el cronómetro de sesión y los selectores clínicos.
 */
export function useRecordingState() {
  // Configuración de Sesión
  const [modo, setModo] = useState<string>('PRE');
  const [region, setRegion] = useState<RegionKey>('CEJA');
  const [lado, setLado] = useState<LadoKey>('DERECHA');
  const [isMockMode, setIsMockMode] = useState<boolean>(true);

  // Cámara e Interfaz
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);

  // Ajuste Fino (Enfoque C)
  const [panelAjusteAbierto, setPanelAjusteAbierto] = useState<boolean>(false);
  const [modoSeleccionActivo, setModoSeleccionActivo] = useState<boolean>(false);
  const [slotsPersonalizados, setSlotsPersonalizados] = useState<(number | null)[]>([null, null, null]);

  // Ciclo de Grabación
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [timerText, setTimerText] = useState<string>('00:00:00');

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartRef = useRef<number>(0);

  // Default indices array reference for the current region & side
  const [defaultIndices, setDefaultIndices] = useState<number[]>([]);

  const getActiveIndices = useCallback(() => {
    const config = PUNTOS_MEDICION[region];
    return lado === 'IZQUIERDA' ? [...config.IZQUIERDA] : [...config.DERECHA];
  }, [region, lado]);

  useEffect(() => {
    setDefaultIndices(getActiveIndices());
    // Reset custom slots when region or side changes
    setSlotsPersonalizados([null, null, null]);
    setModoSeleccionActivo(false);
  }, [region, lado, getActiveIndices]);

  // Chronometer logic
  const startChronometer = useCallback(() => {
    recordingStartRef.current = performance.now();
    recordingTimerRef.current = setInterval(() => {
      const elapsed = performance.now() - recordingStartRef.current;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      const millis  = Math.floor((elapsed % 1000) / 10);
      const pad = (n: number) => String(n).padStart(2, '0');
      setTimerText(`${pad(minutes)}:${pad(seconds)}:${pad(millis)}`);
    }, 10);
  }, []);

  const stopChronometer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    setModoSeleccionActivo(false);
    setIsRecording(true);
    setTimerText('00:00:00');
    startChronometer();
  }, [startChronometer]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    stopChronometer();
  }, [stopChronometer]);

  // Adjust slots callbacks (Enfoque C)
  const handleRegionChange = useCallback((newRegion: RegionKey) => {
    setRegion(newRegion);
  }, []);

  const handleLandmarkClick = useCallback((idx: number) => {
    setSlotsPersonalizados(prev => {
      const copy = [...prev];
      const emptyIdx = copy.indexOf(null);
      if (emptyIdx !== -1) {
        copy[emptyIdx] = idx;
      }
      return copy;
    });
  }, []);

  const resetSlot = useCallback((index: number) => {
    setSlotsPersonalizados(prev => {
      const copy = [...prev];
      copy[index] = null;
      return copy;
    });
  }, []);

  const resetAllSlots = useCallback(() => {
    setSlotsPersonalizados([null, null, null]);
  }, []);

  const getCustomLandmarksArray = useCallback((): [number, number, number] | null => {
    if (slotsPersonalizados.every(s => s !== null)) {
      return slotsPersonalizados as [number, number, number];
    }
    return null;
  }, [slotsPersonalizados]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  return {
    modo,
    setModo,
    region,
    handleRegionChange,
    lado,
    setLado,
    isMockMode,
    setIsMockMode,
    isCameraActive,
    setIsCameraActive,
    zoom,
    setZoom,
    panelAjusteAbierto,
    setPanelAjusteAbierto,
    modoSeleccionActivo,
    setModoSeleccionActivo,
    slotsPersonalizados,
    defaultIndices,
    isRecording,
    timerText,
    startRecording,
    stopRecording,
    handleLandmarkClick,
    resetSlot,
    resetAllSlots,
    getCustomLandmarksArray,
    stopChronometer
  };
}
