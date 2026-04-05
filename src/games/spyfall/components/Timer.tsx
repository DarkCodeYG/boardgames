import { useState, useEffect, useRef } from 'react';
import { sfxTimerTick } from '../../../lib/sound';

interface TimerProps {
  startedAt: number;
  durationMinutes: number;
  onTimeUp: () => void;
}

export default function Timer({ startedAt, durationMinutes, onTimeUp }: TimerProps) {
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const prevRef = useRef(remaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, durationMinutes * 60 - elapsed);
      setRemaining(left);
      // 마지막 5초 틱 사운드
      if (left <= 5 && left > 0 && left !== prevRef.current) {
        sfxTimerTick();
      }
      prevRef.current = left;
      if (left <= 0) {
        onTimeUp();
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, onTimeUp]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isUrgent = remaining <= 30;

  return (
    <div className={`text-4xl font-mono font-black ${isUrgent ? 'text-red-500 animate-pulse' : 'text-stone-800'}`}>
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}
