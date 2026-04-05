import { useRef, useEffect, useCallback, useState } from 'react';
import { sfxClick } from '../../../lib/sound';

interface DrawCanvasProps {
  disabled?: boolean;
  undoLabel?: string;
  eraserLabel?: string;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  strokeColor?: string;
  baselineSnapshot?: ImageData | null;
}

export default function DrawCanvas({
  disabled = false,
  undoLabel = 'Undo',
  eraserLabel = 'Eraser',
  canvasRef: externalRef,
  strokeColor = '#000000',
  baselineSnapshot,
}: DrawCanvasProps) {
  const internalRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalRef ?? internalRef;
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const hasDrawnRef = useRef(false);
  const baselineCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 새 플레이어 턴 시작 시: undo 스택 초기화 + baseline 캔버스 생성
  useEffect(() => {
    setUndoStack([]);
    setTool('pen');
    if (!baselineSnapshot) {
      baselineCanvasRef.current = null;
      return;
    }
    const tmp = document.createElement('canvas');
    tmp.width = baselineSnapshot.width;
    tmp.height = baselineSnapshot.height;
    const tmpCtx = tmp.getContext('2d');
    if (tmpCtx) tmpCtx.putImageData(baselineSnapshot, 0, 0);
    baselineCanvasRef.current = tmp;
  }, [baselineSnapshot]);

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

  // 지우개: baseline 스냅샷의 해당 원형 영역 복원
  const eraseAt = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const baseline = baselineCanvasRef.current;
    if (!baseline) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(baseline, 0, 0);
    ctx.restore();
  }, []);

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

    if (tool === 'eraser') {
      eraseAt(ctx, pos.x, pos.y);
    } else {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
    }
  }, [disabled, strokeColor, tool, eraseAt]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    const last = lastPointRef.current;
    if (!last) return;

    if (tool === 'eraser') {
      eraseAt(ctx, pos.x, pos.y);
    } else {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    lastPointRef.current = pos;
  }, [disabled, strokeColor, tool, eraseAt]);

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

  const cursorStyle = disabled ? 'default' : tool === 'eraser' ? 'cell' : 'crosshair';

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-white rounded-xl touch-none select-none"
        style={{ touchAction: 'none', cursor: cursorStyle, WebkitUserSelect: 'none', userSelect: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      {!disabled && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            onClick={() => { sfxClick(); setTool((t) => t === 'eraser' ? 'pen' : 'eraser'); }}
            className={`backdrop-blur-sm border font-bold px-3 py-1.5 rounded-lg shadow text-sm transition-all active:scale-95
              ${tool === 'eraser'
                ? 'bg-amber-100 border-amber-400 text-amber-700'
                : 'bg-white/90 border-stone-300 text-stone-700 hover:bg-stone-100'}`}
          >
            🧹 {eraserLabel}
          </button>
          {undoStack.length > 0 && (
            <button
              onClick={handleUndo}
              className="bg-white/90 backdrop-blur-sm border border-stone-300
                         text-stone-700 font-bold px-3 py-1.5 rounded-lg shadow text-sm
                         hover:bg-stone-100 active:scale-95 transition-all"
            >
              ↩ {undoLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
