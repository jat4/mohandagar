/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  const start = startTimestamp ? Number(startTimestamp) : null;
  const finish = finishTimestamp ? Number(finishTimestamp) : null;

  const [elapsedMs, setElapsedMs] = useState<number>(() => {
    if (!start || isNaN(start)) return 0;
    if (finish && !isNaN(finish)) return Math.max(0, finish - start);
    if (isRunning) return Math.max(0, TimeSyncService.now() - start);
    return 0;
  });

  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start || isNaN(start)) {
      setElapsedMs(0);
      return;
    }

    if (finish && !isNaN(finish)) {
      setElapsedMs(Math.max(0, finish - start));
      return;
    }

    if (!isRunning) {
      setElapsedMs(0);
      return;
    }

    const updateTimer = () => {
      const now = TimeSyncService.now();
      setElapsedMs(Math.max(0, now - start));
      animFrameRef.current = requestAnimationFrame(updateTimer);
    };

    // Immediate initial sync on change
    updateTimer();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [start, finish, isRunning]);

  const sizeClasses = {
    sm: 'text-base sm:text-lg md:text-xl font-mono tracking-tight font-bold whitespace-nowrap',
    md: 'text-2xl sm:text-3xl md:text-4xl font-mono tracking-tight font-extrabold whitespace-nowrap',
    lg: 'text-3xl sm:text-5xl md:text-6xl font-mono tracking-tight font-black whitespace-nowrap',
    hero: 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-mono tracking-tighter font-black whitespace-nowrap'
  };

  const formatted = formatTimeMs(elapsedMs, true);

  return (
    <div className={`tabular-nums select-none flex justify-center items-center overflow-hidden ${className}`}>
      <span className={sizeClasses[size]}>{formatted}</span>
    </div>
  );
};
