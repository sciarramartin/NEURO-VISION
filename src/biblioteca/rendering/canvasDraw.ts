import { Point, LandmarkRaw, RegionKey, LadoKey, PUNTOS_MEDICION } from '@/biblioteca/math/angles';

export const COLORES_SLOT: Record<number, string> = {
  0: '#22d3ee', // cyan  — P1
  1: '#facc15', // yellow — Vértice (P2)
  2: '#e879f9'  // magenta — P3
};

/**
 * Strategy/Adapter: Dibujado desacoplado de las líneas y vértices del ángulo biomecánico.
 */
export function drawAngleOverlays(
  ctxLive: CanvasRenderingContext2D,
  ctxMesh: CanvasRenderingContext2D,
  pts: Point[],
  isCustom: boolean
) {
  const lineColor = isCustom ? '#f59e0b' : '#10b981'; // gold vs emerald

  [ctxLive, ctxMesh].forEach(ctx => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Vertex glow (P2)
    ctx.beginPath();
    ctx.arc(pts[1].x, pts[1].y, 8, 0, 2 * Math.PI);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Slot-colored dots
    pts.forEach((p, i) => {
      const slotColor = isCustom ? COLORES_SLOT[i] : '#f4f4f5';
      ctx.fillStyle = slotColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      if (isCustom) {
        ctx.fillStyle = slotColor;
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`P${i + 1}`, p.x + 7, p.y - 4);
      }
    });
  });
}

/**
 * Adapter Pattern: Resaltar en el canvas el landmark sobre el que se encuentra el cursor.
 */
export function drawHoverHighlight(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  hoveredIdx: number
) {
  ctx.save();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(px, py, 10, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`#${hoveredIdx}`, px + 12, py + 4);
  ctx.restore();
}

/**
 * Dibuja los landmarks interactivos durante el modo de Ajuste Fino (Enfoque C).
 */
export function drawSelectionModeLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: LandmarkRaw[],
  customIndices: [number, number, number] | null,
  getCanvasCoords: (lm: LandmarkRaw) => { x: number; y: number }
) {
  landmarks.forEach((lm, idx) => {
    const { x: px, y: py } = getCanvasCoords(lm);
    let isSelectedSlot = false;
    let slotColor = 'rgba(99, 102, 241, 0.45)'; // default low emphasis indigo
    let radius = 2;

    if (customIndices) {
      const slotIdx = customIndices.indexOf(idx);
      if (slotIdx !== -1) {
        isSelectedSlot = true;
        slotColor = COLORES_SLOT[slotIdx];
        radius = 5.5;
      }
    }

    ctx.fillStyle = slotColor;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, 2 * Math.PI);
    ctx.fill();

    if (isSelectedSlot) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, radius + 1.5, 0, 2 * Math.PI);
      ctx.stroke();
    }
  });
}

/**
 * Dibuja las conexiones del esqueleto para la vista de Pose de cuerpo completo.
 */
export function drawSkeletonConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: LandmarkRaw[],
  getCanvasCoords: (lm: LandmarkRaw) => { x: number; y: number }
) {
  const poseConnections = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24],
    [15, 19], [16, 20]
  ];
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
  ctx.lineWidth = 1.5;
  poseConnections.forEach(([i1, i2]) => {
    if (landmarks[i1] && landmarks[i2]) {
      const p1 = getCanvasCoords(landmarks[i1]);
      const p2 = getCanvasCoords(landmarks[i2]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  });
}

/**
 * Strategy/Decorator Pattern: Simulación sintética del movimiento facial o corporal (Mock Mode)
 * con vibración senoidal y armónicos para representar el temblor clínico.
 */
export function drawMockLandmarks(
  ctxLive: CanvasRenderingContext2D,
  ctxMesh: CanvasRenderingContext2D,
  width: number,
  height: number,
  timestamp: number,
  region: RegionKey,
  lado: LadoKey,
  landmarksPersonalizados: [number, number, number] | null
): number {
  const regionType = PUNTOS_MEDICION[region].tipo;
  const t = timestamp / 1000;
  const baseFreq = 5.2;
  const tremor = Math.sin(t * baseFreq * 2 * Math.PI) * 1.5;
  const slowMove = Math.sin(t * 0.5 * 2 * Math.PI) * 10;

  let simulatedAngle = 0;
  const cx = width / 2;
  const cy = height / 2;
  let pts: Point[] = [];

  if (regionType === 'rostro') {
    ctxLive.fillStyle = '#18181b';
    ctxLive.fillRect(0, 0, width, height);
    ctxLive.strokeStyle = '#27272a';
    ctxLive.lineWidth = 2;
    ctxLive.beginPath();
    ctxLive.arc(cx, cy, 120, 0, 2 * Math.PI);
    ctxLive.stroke();

    if (region === 'BOCA') {
      simulatedAngle = 120 + slowMove + tremor;
      pts = [
        { x: cx - 40, y: cy + 40 },
        { x: cx, y: cy + 50 + (simulatedAngle - 120) / 3 },
        { x: cx + 40, y: cy + 40 }
      ];
    } else if (region === 'PARPADO') {
      const blink = Math.sin(t * 0.25 * 2 * Math.PI) > 0.8 ? 5 : 28;
      simulatedAngle = blink + tremor;
      pts = [
        { x: cx - 40, y: cy - 30 },
        { x: cx - 20, y: cy - 35 - (simulatedAngle / 3) },
        { x: cx, y: cy - 30 }
      ];
    } else if (region === 'CEJA') {
      simulatedAngle = 150 - (slowMove / 2) + tremor;
      pts = [
        { x: cx - 50, y: cy - 60 },
        { x: cx - 25, y: cy - 70 - (simulatedAngle / 10) },
        { x: cx, y: cy - 60 }
      ];
    } else {
      simulatedAngle = 90 + tremor;
      pts = [
        { x: cx - 40, y: cy },
        { x: cx, y: cy + tremor },
        { x: cx + 40, y: cy }
      ];
    }

    if (lado === 'DERECHA') {
      pts = pts.map(p => ({ x: p.x + 35, y: p.y }));
    } else {
      pts = pts.map(p => ({ x: p.x - 35, y: p.y }));
    }

    [ctxLive, ctxMesh].forEach(ctx => {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * 2 * Math.PI;
        const rx = cx + Math.cos(angle) * 80;
        const ry = cy + Math.sin(angle) * 80;
        ctx.beginPath();
        ctx.arc(rx, ry, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

  } else {
    // Body mock
    ctxLive.fillStyle = '#18181b';
    ctxLive.fillRect(0, 0, width, height);

    const tremorBody = Math.sin(t * baseFreq * 2 * Math.PI) * 1.8;
    const slowMoveBody = Math.sin(t * 0.4 * 2 * Math.PI) * 15;
    const cyBody = cy - 20;

    if (region === 'CODO') {
      simulatedAngle = 90 + slowMoveBody + tremorBody;
    } else if (region === 'MUÑECA') {
      simulatedAngle = 160 + slowMoveBody / 2 + tremorBody * 2;
    } else if (region === 'HOMBRO') {
      simulatedAngle = 10 + Math.sin(t * 0.2 * 2 * Math.PI) * 4 + tremorBody / 3;
    }

    const head = { x: cx, y: cyBody - 70 };
    const neck = { x: cx, y: cyBody - 40 };
    const leftShoulder = { x: cx - 60, y: cyBody - 30 };
    const rightShoulder = { x: cx + 60, y: cyBody - 30 };
    const leftHip = { x: cx - 40, y: cyBody + 90 };
    const rightHip = { x: cx + 40, y: cyBody + 90 };

    let lElbow = { x: cx - 90, y: cyBody + 20 };
    let lWrist = { x: cx - 110, y: cyBody + 70 };
    let rElbow = { x: cx + 90, y: cyBody + 20 };
    let rWrist = { x: cx + 110, y: cyBody + 70 };

    if (region === 'CODO') {
      const angleRad = (simulatedAngle * Math.PI) / 180;
      if (lado === 'IZQUIERDA') {
        lElbow = { x: leftShoulder.x - Math.cos(angleRad - 0.5) * 60, y: leftShoulder.y + Math.sin(angleRad - 0.5) * 60 };
        lWrist = { x: lElbow.x - Math.cos(angleRad + 0.2) * 50, y: lElbow.y + Math.sin(angleRad + 0.2) * 50 };
      } else {
        rElbow = { x: rightShoulder.x + Math.cos(angleRad - 0.5) * 60, y: rightShoulder.y + Math.sin(angleRad - 0.5) * 60 };
        rWrist = { x: rElbow.x + Math.cos(angleRad + 0.2) * 50, y: rElbow.y + Math.sin(angleRad + 0.2) * 50 };
      }
    } else if (region === 'MUÑECA') {
      const angleRad = (simulatedAngle * Math.PI) / 180;
      if (lado === 'IZQUIERDA') {
        lWrist = { x: lElbow.x - 40, y: lElbow.y + Math.sin(angleRad) * 40 };
      } else {
        rWrist = { x: rElbow.x + 40, y: rElbow.y + Math.sin(angleRad) * 40 };
      }
    } else if (region === 'HOMBRO') {
      const tilt = (simulatedAngle * Math.PI) / 180;
      leftShoulder.y = cyBody - 30 - Math.sin(tilt) * 20;
      rightShoulder.y = cyBody - 30 + Math.sin(tilt) * 20;
    }

    [ctxLive, ctxMesh].forEach(ctx => {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 18, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(neck.x, neck.y);
      ctx.lineTo(cx, cyBody + 90);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(leftShoulder.x, leftShoulder.y);
      ctx.lineTo(rightShoulder.x, rightShoulder.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(leftHip.x, leftHip.y);
      ctx.lineTo(rightHip.x, rightHip.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(leftShoulder.x, leftShoulder.y);
      ctx.lineTo(lElbow.x, lElbow.y);
      ctx.lineTo(lWrist.x, lWrist.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightShoulder.x, rightShoulder.y);
      ctx.lineTo(rElbow.x, rElbow.y);
      ctx.lineTo(rWrist.x, rWrist.y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(99, 102, 241, 0.55)';
      [leftShoulder, rightShoulder, lElbow, rElbow, lWrist, rWrist, leftHip, rightHip].forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    if (region === 'CODO') {
      pts = lado === 'IZQUIERDA' ? [leftShoulder, lElbow, lWrist] : [rightShoulder, rElbow, rWrist];
    } else if (region === 'MUÑECA') {
      const lHandTip = { x: lWrist.x - 15, y: lWrist.y + 10 };
      const rHandTip = { x: rWrist.x + 15, y: rWrist.y + 10 };
      pts = lado === 'IZQUIERDA' ? [lElbow, lWrist, lHandTip] : [rElbow, rWrist, rHandTip];
    } else if (region === 'HOMBRO') {
      pts = lado === 'IZQUIERDA' ? [rightShoulder, leftShoulder, leftHip] : [leftShoulder, rightShoulder, rightHip];
    }
  }

  drawAngleOverlays(ctxLive, ctxMesh, pts, !!landmarksPersonalizados);
  return simulatedAngle;
}
