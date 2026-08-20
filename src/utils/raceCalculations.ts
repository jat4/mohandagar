import { 
  Checkpoint, 
  TimingEvent, 
  MeasuredSegment, 
  ProcessedCheckpointResult, 
  RaceStatistics, 
  DistanceUnit,
  Race
} from '../types/race';

/**
 * Format milliseconds into HH:MM:SS.mmm or MM:SS.mmm
 */
export function formatTimeMs(ms: number | null | undefined, includeHours = false): string {
  if (ms == null || isNaN(ms) || ms < 0) return '--:--.---';

  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor(ms % 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const padMs = (n: number) => String(n).padStart(3, '0');

  if (hours > 0 || includeHours) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${padMs(milliseconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}.${padMs(milliseconds)}`;
}

/**
 * Format pace in seconds/km to MM:SS/km
 */
export function formatPace(secondsPerKm: number | null | undefined): string {
  if (secondsPerKm == null || isNaN(secondsPerKm) || !isFinite(secondsPerKm) || secondsPerKm <= 0) {
    return '--:--/km';
  }
  const totalSecs = Math.round(secondsPerKm);
  const minutes = Math.floor(totalSecs / 60);
  const seconds = totalSecs % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}/km`;
}

/**
 * Format speed in km/h to XX.XX km/h
 */
export function formatSpeed(kmh: number | null | undefined): string {
  if (kmh == null || isNaN(kmh) || !isFinite(kmh) || kmh <= 0) {
    return '--.-- km/h';
  }
  return `${kmh.toFixed(2)} km/h`;
}

/**
 * Format distance in meters according to selected unit
 */
export function formatDistance(meters: number, unit: DistanceUnit = 'METERS'): string {
  if (meters == null || isNaN(meters) || meters < 0) return '0 m';

  switch (unit) {
    case 'KILOMETERS':
      return `${(meters / 1000).toFixed(2)} km`;
    case 'MILES':
      return `${(meters / 1609.344).toFixed(2)} mi`;
    case 'METERS':
    default:
      if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)} km (${meters} m)`;
      }
      return `${meters} m`;
  }
}

/**
 * Generates a random alphanumeric Join Code (e.g. "8K4P-29")
 */
export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part1 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const part2 = Array.from({ length: 2 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `${part1}-${part2}`;
}

/**
 * Computes all race statistics, segments, missed checkpoints, cumulative pace/speed,
 * and best/slowest splits adhering strictly to missed checkpoint recovery.
 */
export function calculateRaceStatistics(
  race: Race,
  events: TimingEvent[]
): RaceStatistics {
  // Sort checkpoints ascending by distance
  const sortedCheckpoints = [...(race.checkpoints || [])].sort(
    (a, b) => a.distanceMeters - b.distanceMeters
  );

  // Map events by checkpointId
  const eventsByCheckpoint = new Map<string, TimingEvent>();
  events.forEach((evt) => {
    // Keep the earliest or primary valid event for that checkpoint
    if (!eventsByCheckpoint.has(evt.checkpointId) || evt.eventType === 'FINISH') {
      eventsByCheckpoint.set(evt.checkpointId, evt);
    }
  });

  const processedCheckpoints: ProcessedCheckpointResult[] = [];
  const measuredSegments: MeasuredSegment[] = [];

  // Anchor at START (0 meters, 0 ms)
  let lastRecordedDistanceMeters = 0;
  let lastRecordedElapsedMs = 0;
  let lastRecordedName = 'START';
  let lastRecordedId = 'START';

  // Tracking for missed checkpoints in sequence
  let pendingMissedNames: string[] = [];

  // Determine if race is finished
  const isFinished = race.status === 'FINISHED';
  let finalActualDistanceMeters = 0;
  let finalActualTimeMs = 0;

  sortedCheckpoints.forEach((cp, index) => {
    const event = eventsByCheckpoint.get(cp.id);
    const hasEvent = !!event && event.elapsedMs > 0;

    // A checkpoint is considered MISSED if the race has progressed past it
    // (i.e. A subsequent checkpoint was recorded or race finished) but this CP was never recorded.
    const subsequentRecorded = sortedCheckpoints.slice(index + 1).some((nextCp) => {
      const nextEvt = eventsByCheckpoint.get(nextCp.id);
      return !!nextEvt && nextEvt.elapsedMs > 0;
    });

    let status: 'RECORDED' | 'MISSED' | 'PENDING' | 'UPCOMING';
    if (hasEvent) {
      status = 'RECORDED';
    } else if (subsequentRecorded || isFinished) {
      status = 'MISSED';
    } else if (race.status === 'RUNNING') {
      status = 'PENDING';
    } else {
      status = 'UPCOMING';
    }

    if (status === 'RECORDED' && event) {
      const currentDistMeters = cp.distanceMeters;
      const currentElapsedMs = event.elapsedMs;

      // Segment distance & time from the LAST valid recorded checkpoint
      const segmentDistanceMeters = currentDistMeters - lastRecordedDistanceMeters;
      const segmentDistanceKm = segmentDistanceMeters / 1000;
      const segmentElapsedMs = currentElapsedMs - lastRecordedElapsedMs;
      const segmentTimeSeconds = segmentElapsedMs / 1000;

      let segmentPaceSecondsPerKm = 0;
      let segmentSpeedKmh = 0;

      if (segmentDistanceKm > 0 && segmentTimeSeconds > 0) {
        segmentPaceSecondsPerKm = segmentTimeSeconds / segmentDistanceKm;
        segmentSpeedKmh = segmentDistanceKm / (segmentTimeSeconds / 3600);
      }

      const segment: MeasuredSegment = {
        fromCheckpointName: lastRecordedName,
        fromCheckpointId: lastRecordedId,
        fromDistanceMeters: lastRecordedDistanceMeters,
        fromElapsedMs: lastRecordedElapsedMs,
        toCheckpointName: cp.name,
        toCheckpointId: cp.id,
        toDistanceMeters: currentDistMeters,
        toElapsedMs: currentElapsedMs,
        segmentDistanceMeters,
        segmentDistanceKm,
        segmentTimeSeconds,
        segmentElapsedMs,
        segmentPaceSecondsPerKm,
        segmentPaceFormatted: formatPace(segmentPaceSecondsPerKm),
        segmentSpeedKmh,
        segmentSpeedFormatted: formatSpeed(segmentSpeedKmh),
        isMultiCheckpointSpan: pendingMissedNames.length > 0,
        missedCheckpointsCount: pendingMissedNames.length,
        missedCheckpointNames: [...pendingMissedNames]
      };

      measuredSegments.push(segment);

      // Cumulative calculations for this recorded point
      const cumulativeDistanceKm = currentDistMeters / 1000;
      const cumulativeTimeSeconds = currentElapsedMs / 1000;
      let cumulativePace = 0;
      let cumulativeSpeed = 0;

      if (cumulativeDistanceKm > 0 && cumulativeTimeSeconds > 0) {
        cumulativePace = cumulativeTimeSeconds / cumulativeDistanceKm;
        cumulativeSpeed = cumulativeDistanceKm / (cumulativeTimeSeconds / 3600);
      }

      processedCheckpoints.push({
        checkpoint: cp,
        status: 'RECORDED',
        event,
        cumulativeDistanceMeters: currentDistMeters,
        cumulativeDistanceKm,
        cumulativeElapsedMs: currentElapsedMs,
        cumulativeElapsedFormatted: formatTimeMs(currentElapsedMs),
        cumulativePaceSecondsPerKm: cumulativePace,
        cumulativePaceFormatted: formatPace(cumulativePace),
        cumulativeSpeedKmh: cumulativeSpeed,
        cumulativeSpeedFormatted: formatSpeed(cumulativeSpeed),
        segment
      });

      // Update baseline for next segment
      lastRecordedDistanceMeters = currentDistMeters;
      lastRecordedElapsedMs = currentElapsedMs;
      lastRecordedName = cp.name;
      lastRecordedId = cp.id;
      pendingMissedNames = [];

      finalActualDistanceMeters = currentDistMeters;
      finalActualTimeMs = currentElapsedMs;

    } else if (status === 'MISSED') {
      // NEVER fabricate time for missed checkpoints
      pendingMissedNames.push(cp.name);

      processedCheckpoints.push({
        checkpoint: cp,
        status: 'MISSED',
        cumulativeDistanceMeters: cp.distanceMeters,
        cumulativeDistanceKm: cp.distanceMeters / 1000,
        cumulativeElapsedFormatted: 'MISSED (No Split)',
        cumulativePaceFormatted: '—',
        cumulativeSpeedFormatted: '—'
      });
    } else {
      // Pending or upcoming
      processedCheckpoints.push({
        checkpoint: cp,
        status,
        cumulativeDistanceMeters: cp.distanceMeters,
        cumulativeDistanceKm: cp.distanceMeters / 1000,
        cumulativeElapsedFormatted: '—',
        cumulativePaceFormatted: '—',
        cumulativeSpeedFormatted: '—'
      });
    }
  });

  // Calculate Best & Slowest Split from valid segments
  // Filter segments where distance > 0 and pace > 0
  const validSegments = measuredSegments.filter(
    (s) => s.segmentDistanceMeters > 0 && s.segmentPaceSecondsPerKm > 0
  );

  let bestSplit: MeasuredSegment | null = null;
  let slowestSplit: MeasuredSegment | null = null;

  if (validSegments.length > 0) {
    // Best Split = Lowest pace (seconds/km)
    bestSplit = [...validSegments].sort(
      (a, b) => a.segmentPaceSecondsPerKm - b.segmentPaceSecondsPerKm
    )[0];

    // Slowest Split = Highest pace (seconds/km)
    slowestSplit = [...validSegments].sort(
      (a, b) => b.segmentPaceSecondsPerKm - a.segmentPaceSecondsPerKm
    )[0];
  }

  // Overall Race average pace & speed based on actual completed distance
  const actualDistanceKm = finalActualDistanceMeters / 1000;
  const actualTimeSeconds = finalActualTimeMs / 1000;
  let overallAvgPace = 0;
  let overallAvgSpeed = 0;

  if (actualDistanceKm > 0 && actualTimeSeconds > 0) {
    overallAvgPace = actualTimeSeconds / actualDistanceKm;
    overallAvgSpeed = actualDistanceKm / (actualTimeSeconds / 3600);
  }

  const recordedCount = processedCheckpoints.filter((c) => c.status === 'RECORDED').length;
  const missedCount = processedCheckpoints.filter((c) => c.status === 'MISSED').length;

  return {
    raceName: race.name,
    runnerName: race.runnerName,
    dateFormatted: new Date(race.createdAt || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    status: race.status,
    totalPlannedDistanceMeters: race.totalPlannedDistanceMeters,
    actualDistanceMeters: finalActualDistanceMeters,
    actualDistanceKm,
    totalTimeMs: finalActualTimeMs,
    totalTimeFormatted: formatTimeMs(finalActualTimeMs),
    averagePaceSecondsPerKm: overallAvgPace,
    averagePaceFormatted: formatPace(overallAvgPace),
    averageSpeedKmh: overallAvgSpeed,
    averageSpeedFormatted: formatSpeed(overallAvgSpeed),
    bestSplit,
    slowestSplit,
    processedCheckpoints,
    measuredSegments,
    missedCheckpointsCount: missedCount,
    recordedCheckpointsCount: recordedCount,
    totalCheckpointsCount: sortedCheckpoints.length
  };
}
