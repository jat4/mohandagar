import React, { useState, useEffect, useRef } from 'react';
import { formatTimeMs } from '../../utils/raceCalculations';
import { TimeSyncService } from '../../services/timeSyncService';

interface RaceTimerClockProps {
  startTimestamp: number | null | undefined;
  finishTimestamp?: number | null | undefined;
  isRunning: boolean;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

export const RaceTimerClock: React.FC<RaceTimerClockProps> = ({
  startTimestamp,
  finishTimestamp,
  isRunning,
  size = 'lg',
  className = ''
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(() => {
    if (!startTimestamp) return 0;
    if (finishTimestamp) return Math.max(0, finishTimestamp - startTimestamp);
    return Math.max(0, TimeSyncService.now() - startTimestamp);
  });

  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startTimestamp) {
      setElapsedMs(0);
      return;
    }

    if (finishTimestamp) {
      setElapsedMs(Math.max(0, finishTimestamp - startTimestamp));
      return;
    }

    if (!isRunning) {
      setElapsedMs(0);
      return;
    }

    const updateTimer = () => {
      const now = TimeSyncService.now();
      setElapsedMs(Math.max(0, now - startTimestamp));
      animFrameRef.current = requestAnimationFrame(updateTimer);
    };

    animFrameRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [startTimestamp, finishTimestamp, isRunning]);

  const sizeClasses = {
    sm: 'text-xl sm:text-2xl font-mono tracking-tight font-bold',
    md: 'text-3xl sm:text-4xl font-mono tracking-tight font-extrabold',
    lg: 'text-5xl sm:text-6xl font-mono tracking-tight font-black',
    hero: 'text-6xl sm:text-7xl md:text-8xl font-mono tracking-tighter font-black'
  };

  const formatted = formatTimeMs(elapsedMs, true);

  return (
    <div className={`tabular-nums select-none ${className}`}>
      <span className={sizeClasses[size]}>{formatted}</span>
    </div>
  );
};
