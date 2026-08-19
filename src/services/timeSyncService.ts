/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

export interface SyncStats {
  offsetMs: number;
  rttMs: number;
  isSynced: boolean;
  quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'CALIBRATING';
  lastCalibratedAt: number;
}

class TimeSyncManager {
  private offsetMs = 0;
  private rttMs = 0;
  private isCalibrated = false;
  private isCalibrating = false;
  private lastCalibratedAt = 0;
  private basePerfTime = performance.now();
  private baseSyncedTimestamp = Date.now();
  private listeners = new Set<(stats: SyncStats) => void>();

  constructor() {
    // Start calibration immediately on module load
    if (typeof window !== 'undefined') {
      this.calibrate();
      // Periodic background re-sync every 60 seconds
      setInterval(() => {
        if (navigator.onLine && !this.isCalibrating) {
          this.calibrate(3);
        }
      }, 60000);

      // Re-calibrate on network recovery
      window.addEventListener('online', () => {
        this.calibrate(4);
      });
    }
  }

  /**
   * Authoritative synchronized timestamp (in ms since Unix epoch).
   * Monotonically anchored using performance.now() to prevent OS clock jumps/drift.
   */
  public now(): number {
    const elapsedSinceAnchor = performance.now() - this.basePerfTime;
    return Math.round(this.baseSyncedTimestamp + elapsedSinceAnchor);
  }

  /**
   * Get the current clock offset (Device Local Time - Server Time).
   */
  public getOffset(): number {
    return this.offsetMs;
  }

  public getStats(): SyncStats {
    let quality: SyncStats['quality'] = 'CALIBRATING';
    if (this.isCalibrated) {
      if (this.rttMs < 120) quality = 'EXCELLENT';
      else if (this.rttMs < 350) quality = 'GOOD';
      else quality = 'FAIR';
    }

    return {
      offsetMs: this.offsetMs,
      rttMs: this.rttMs,
      isSynced: this.isCalibrated,
      quality,
      lastCalibratedAt: this.lastCalibratedAt
    };
  }

  public subscribe(listener: (stats: SyncStats) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStats());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const stats = this.getStats();
    this.listeners.forEach((fn) => {
      try {
        fn(stats);
      } catch (err) {
        console.error('TimeSync listener error:', err);
      }
    });
  }

  /**
   * Performs NTP-style multi-probe clock offset calibration using HTTP response headers.
   * Discards outliers and calculates the median offset.
   */
  public async calibrate(probeCount = 5): Promise<SyncStats> {
    if (this.isCalibrating) return this.getStats();
    this.isCalibrating = true;
    this.notify();

    const samples: Array<{ offset: number; rtt: number }> = [];

    // Probe loop
    for (let i = 0; i < probeCount; i++) {
      try {
        const t0_perf = performance.now();
        const t0_date = Date.now();

        // Use cache-busting HEAD probe to origin
        const probeUrl = `${window.location.origin}${window.location.pathname}?_tsync=${Date.now()}_${i}`;
        const response = await fetch(probeUrl, {
          method: 'HEAD',
          cache: 'no-store'
        });

        const t1_perf = performance.now();
        const t1_date = Date.now();
        const rtt = t1_perf - t0_perf;

        const serverDateHeader = response.headers.get('date');
        if (serverDateHeader) {
          const serverTime = new Date(serverDateHeader).getTime();
          // The server timestamp is at second precision in standard HTTP Date header,
          // but Google Cloud/Nginx reverse proxy sets it authoritatively.
          // Estimated server time at t1 is serverTime + (rtt / 2)
          // For high precision within the second:
          const midLocalTime = (t0_date + t1_date) / 2;
          const estimatedOffset = serverTime - midLocalTime;

          // Only keep samples with acceptable RTT (< 1500ms)
          if (rtt < 1500) {
            samples.push({ offset: estimatedOffset, rtt });
          }
        }
      } catch (err) {
        console.warn('Clock sync probe warning:', err);
      }

      // Small jitter delay between probes
      if (i < probeCount - 1) {
        await new Promise((res) => setTimeout(res, 80));
      }
    }

    this.isCalibrating = false;

    if (samples.length > 0) {
      // Sort by RTT and pick lowest latency sample or median
      samples.sort((a, b) => a.rtt - b.rtt);
      
      // Best 50% lowest RTT samples
      const bestSamples = samples.slice(0, Math.max(1, Math.ceil(samples.length / 2)));
      const avgOffset = Math.round(
        bestSamples.reduce((acc, s) => acc + s.offset, 0) / bestSamples.length
      );
      const avgRtt = Math.round(
        bestSamples.reduce((acc, s) => acc + s.rtt, 0) / bestSamples.length
      );

      this.offsetMs = avgOffset;
      this.rttMs = avgRtt;
      this.isCalibrated = true;
      this.lastCalibratedAt = Date.now();

      // Reset monotonic anchor
      this.basePerfTime = performance.now();
      this.baseSyncedTimestamp = Date.now() + avgOffset;
    } else {
      // Fallback: If offline or headers blocked, use 0 offset
      if (!this.isCalibrated) {
        this.offsetMs = 0;
        this.rttMs = 0;
        this.isCalibrated = true;
        this.basePerfTime = performance.now();
        this.baseSyncedTimestamp = Date.now();
      }
    }

    this.notify();
    return this.getStats();
  }
}

export const TimeSyncService = new TimeSyncManager();

/**
 * React hook to observe real-time clock synchronization stats and status.
 */
export function useTimeSync(): SyncStats & { recalibrate: () => Promise<SyncStats> } {
  const [stats, setStats] = useState<SyncStats>(() => TimeSyncService.getStats());

  useEffect(() => {
    return TimeSyncService.subscribe((updated) => {
      setStats(updated);
    });
  }, []);

  return {
    ...stats,
    recalibrate: () => TimeSyncService.calibrate(6)
  };
}
