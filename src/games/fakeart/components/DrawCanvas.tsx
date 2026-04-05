import { useRef, useEffect, useCallback, useState } from 'react';
import { sfxClick } from '../../../lib/sound';

interface DrawCanvasProps {
  disabled?: boolean;
  undoLabel?: string;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  strokeColor?: string;
}

export default function DrawCanvas({ disabled = false, undoLabel = 'Undo', canvasRef: externalRef, strokeColor = '#000000' }: DrawCanvasProps) {
  const internalRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalRef ?? internalRef;
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const hasDrawnRef = useRef(false); // 실제로 그린 적 있는지 추적

  // 캔버스를 부모 크기에 맞게 리사이즈
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // 실제로 그린 내용이 있을 때만 복원 (기본 캔버스 검정 픽셀 복원 방지)
      const imageData = hasDrawnRef.current
        ? ctx.getImageData(0, 0, canvas.width, canvas.height)
        : null;
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (imageData) ctx.putImageData(imageData, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    const parent = canvas.parentElement;
    if (parent) observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 획 시작 전 현재 상태 저장 (undo용)
    hasDrawnRef.current = true;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => [...prev, snapshot]);

    isDrawingRef.current = true;
    const pos = getPos(e);
    lastPointRef.current = pos;

    // 점 찍기 (클릭만 했을 때)
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
  }, [disabled, strokeColor]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    const last = lastPointRef.current;
    if (!last) return;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPointRef.current = pos;
  }, [disabled, strokeColor]);

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    sfxClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newStack = [...undoStack];
    const prev = newStack.pop()!;
    ctx.putImageData(prev, 0, 0);
    setUndoStack(newStack);
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-white rounded-xl touch-none"
        style={{ touchAction: 'none', cursor: disabled ? 'default' : 'crosshair' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {!disabled && undoStack.length > 0 && (
        <button
          onClick={handleUndo}
          className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm border border-stone-300
                     text-stone-700 font-bold px-3 py-1.5 rounded-lg shadow text-sm
                     hover:bg-stone-100 active:scale-95 transition-all"
        >
          ↩ {undoLabel}
        </button>
      )}
    </div>
  );
}
