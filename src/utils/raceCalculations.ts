import { 
  Checkpoint, 
  TimingEvent, 
  MeasuredSegment, 
  ProcessedCheckpointResult, 
  RaceStatistics, 
  DistanceUnit,
  Race,
  CheckpointPrediction,
  LiveRunnerProgress,
  normalizeCheckpointType,
  isRaceRunning,
  isRaceFinished
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
 * Formats a Date or timestamp into 12-hour wall-clock time string with AM/PM (e.g., "09:36:34 PM").
 */
export function formatWallClockTime12h(dateOrTimestamp: Date | number): string {
  const date = typeof dateOrTimestamp === 'number' ? new Date(dateOrTimestamp) : dateOrTimestamp;
  if (!date || isNaN(date.getTime())) return '--:--:-- --';

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12

  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');

  return `${hoursStr}:${minutesStr}:${secondsStr} ${ampm}`;
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
    const isStartCp = normalizeCheckpointType(cp.type) === 'start' || cp.isStart || (cp.distanceMeters === 0 && index === 0);
    const event = eventsByCheckpoint.get(cp.id);
    const hasEvent = !!event;

    // A checkpoint is considered MISSED if the race has progressed past it
    // (i.e. A subsequent checkpoint was recorded or race finished) but this CP was never recorded.
    const subsequentRecorded = sortedCheckpoints.slice(index + 1).some((nextCp) => {
      const nextEvt = eventsByCheckpoint.get(nextCp.id);
      return !!nextEvt && nextEvt.elapsedMs > 0;
    });

    if (isStartCp) {
      // START LINE special checkpoint logic:
      // Distance is ALWAYS 0m, no segment calculation, recorded if race started
      const startRecorded = hasEvent || race.status === 'RUNNING' || isFinished || !!race.startTimestamp;
      const startEvent = event || (startRecorded ? {
        id: `evt_start_${race.id}`,
        raceId: race.id,
        checkpointId: cp.id,
        checkpointName: cp.name,
        checkpointDistanceMeters: 0,
        timestamp: race.startTimestamp || race.createdAt || Date.now(),
        elapsedMs: 0,
        recordedByUid: 'starter',
        staffName: cp.assignedStaffName || 'Race Starter',
        deviceId: 'start_device',
        eventType: 'START' as const
      } : undefined);

      processedCheckpoints.push({
        checkpoint: cp,
        status: startRecorded ? 'RECORDED' : (race.status === 'RUNNING' ? 'PENDING' : 'UPCOMING'),
        event: startEvent,
        cumulativeDistanceMeters: 0,
        cumulativeDistanceKm: 0,
        cumulativeElapsedMs: 0,
        cumulativeElapsedFormatted: startRecorded ? '00:00.000' : '—',
        cumulativePaceFormatted: '—',
        cumulativeSpeedFormatted: '—'
      });

      lastRecordedDistanceMeters = 0;
      lastRecordedElapsedMs = 0;
      lastRecordedName = cp.name;
      lastRecordedId = cp.id;
      return;
    }

    let status: 'RECORDED' | 'MISSED' | 'PENDING' | 'UPCOMING';
    if (hasEvent && event && event.elapsedMs > 0) {
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

/**
 * Computes real-time live runner progress and next checkpoint arrival prediction.
 * Uses the runner's most recent measured pace & speed from recorded segments.
 *
 * Prediction formula:
 * Remaining distance to next checkpoint = (targetCheckpoint.distanceMeters - lastRecordedDistanceMeters)
 * Estimated time = (remainingDistanceMeters / 1000) * segmentPaceSecondsPerKm * 1000 ms
 * Estimated Arrival Elapsed Ms = lastRecordedElapsedMs + estimatedTimeMs
 * Expected Wall Clock Time = race.startTimestamp + estimatedArrivalElapsedMs
 */
export function calculateLiveRunnerProgress(
  race: Race,
  events: TimingEvent[],
  stats?: RaceStatistics
): LiveRunnerProgress {
  const currentStats = stats || calculateRaceStatistics(race, events);
  const isRunning = isRaceRunning(race.status);
  const isFinished = isRaceFinished(race.status);

  const sortedCheckpoints = [...(race.checkpoints || [])].sort(
    (a, b) => a.distanceMeters - b.distanceMeters
  );

  // Find all recorded checkpoints with valid timing events
  const recordedProcessed = currentStats.processedCheckpoints.filter(
    (cp) => cp.status === 'RECORDED' && cp.event
  );

  const lastRecorded = recordedProcessed.length > 0
    ? recordedProcessed[recordedProcessed.length - 1]
    : null;

  const lastRecordedIndex = lastRecorded
    ? sortedCheckpoints.findIndex((cp) => cp.id === lastRecorded.checkpoint.id)
    : -1;

  const lastRecordedEvent = lastRecorded?.event || null;

  // Determine runner status state and labels
  let runnerStatusState: 'WAITING_FOR_START' | 'RUNNING' | 'CHECKPOINT_REACHED' | 'FINISHED' = 'WAITING_FOR_START';
  let runnerStatusLabel = 'WAITING FOR START';

  if (isFinished) {
    runnerStatusState = 'FINISHED';
    runnerStatusLabel = 'FINISHED';
  } else if (isRunning) {
    if (lastRecordedIndex > 0) {
      runnerStatusState = 'CHECKPOINT_REACHED';
      runnerStatusLabel = 'CHECKPOINT REACHED';
    } else {
      runnerStatusState = 'RUNNING';
      runnerStatusLabel = 'RUNNING';
    }
  }

  // Current Position Label
  let currentPositionLabel = 'START LINE';
  if (isFinished) {
    currentPositionLabel = 'FINISH LINE';
  } else if (lastRecorded) {
    if (lastRecorded.cumulativeDistanceMeters > 0) {
      currentPositionLabel = `${lastRecorded.checkpoint.name} — ${formatDistance(lastRecorded.cumulativeDistanceMeters, race.displayUnit)}`;
    } else {
      currentPositionLabel = lastRecorded.checkpoint.name || 'START LINE';
    }
  }

  // Distances
  const currentDistanceMeters = isFinished
    ? currentStats.actualDistanceMeters
    : (lastRecorded ? lastRecorded.cumulativeDistanceMeters : 0);
  const totalDistanceMeters = race.totalPlannedDistanceMeters;
  const distanceCoveredFormatted = `${formatDistance(currentDistanceMeters, race.displayUnit)} / ${formatDistance(totalDistanceMeters, race.displayUnit)}`;

  // Pace & Speed metrics
  let latestPaceFormatted = '—';
  let latestSpeedFormatted = '—';
  if (isFinished) {
    latestPaceFormatted = currentStats.averagePaceFormatted;
    latestSpeedFormatted = currentStats.averageSpeedFormatted;
  } else if (lastRecorded?.segment?.segmentPaceFormatted && lastRecorded.segment.segmentPaceFormatted !== '—') {
    latestPaceFormatted = lastRecorded.segment.segmentPaceFormatted;
    latestSpeedFormatted = lastRecorded.segment.segmentSpeedFormatted || '—';
  } else if (currentStats.averagePaceFormatted && currentStats.averagePaceFormatted !== '—') {
    latestPaceFormatted = currentStats.averagePaceFormatted;
    latestSpeedFormatted = currentStats.averageSpeedFormatted || '—';
  }

  // Last Split Time
  let lastSplitTimeFormatted = '—';
  if (isFinished) {
    lastSplitTimeFormatted = formatTimeMs(
      race.finishTimestamp && race.startTimestamp
        ? race.finishTimestamp - race.startTimestamp
        : currentStats.totalTimeMs
    );
  } else if (lastRecorded) {
    lastSplitTimeFormatted = lastRecorded.cumulativeElapsedFormatted;
  } else if (race.startTimestamp && isRunning) {
    lastSplitTimeFormatted = '00:00.000';
  }

  // Last Update Timestamp
  const lastUpdatedAt = lastRecordedEvent?.timestamp || race.finishTimestamp || race.startTimestamp || race.updatedAt || race.createdAt;
  const lastUpdatedAtFormatted = lastUpdatedAt
    ? formatWallClockTime12h(lastUpdatedAt)
    : '—';

  // Determine next checkpoint & prediction
  let nextCheckpoint: Checkpoint | null = null;
  let nextPrediction: CheckpointPrediction | null = null;
  let finishPrediction: CheckpointPrediction | null = null;
  let hasEnoughDataForEta = false;

  if (isRunning && !isFinished) {
    if (lastRecordedIndex + 1 < sortedCheckpoints.length) {
      nextCheckpoint = sortedCheckpoints[lastRecordedIndex + 1];
    }

    // Check if we have measured pace/speed to base predictions on
    // Prioritize the most recent measured segment from the runner
    const recentSegment = currentStats.measuredSegments.length > 0
      ? currentStats.measuredSegments[currentStats.measuredSegments.length - 1]
      : null;

    const paceSecsPerKm = recentSegment?.segmentPaceSecondsPerKm || currentStats.averagePaceSecondsPerKm || 0;
    const speedKmh = recentSegment?.segmentSpeedKmh || currentStats.averageSpeedKmh || 0;

    const fromDistMeters = lastRecorded?.cumulativeDistanceMeters || 0;
    const fromElapsedMs = lastRecorded?.cumulativeElapsedMs || 0;
    const fromName = lastRecorded?.checkpoint.name || 'START';

    // Helper to calculate prediction for a target checkpoint
    const calculatePredictionForTarget = (targetCp: Checkpoint): CheckpointPrediction | null => {
      const remainingDistMeters = targetCp.distanceMeters - fromDistMeters;
      if (remainingDistMeters <= 0 || paceSecsPerKm <= 0 || speedKmh <= 0) {
        return null;
      }

      // Remaining distance in km
      const remainingDistKm = remainingDistMeters / 1000;
      // Estimated segment time in ms: remainingDistKm * paceSecsPerKm * 1000
      const estimatedSegmentTimeMs = Math.round(remainingDistKm * paceSecsPerKm * 1000);
      const estimatedRaceElapsedMs = fromElapsedMs + estimatedSegmentTimeMs;
      
      const startMs = race.startTimestamp || (Date.now() - fromElapsedMs);
      const expectedWallClockTimestamp = startMs + estimatedRaceElapsedMs;
      const expectedWallClockDate = new Date(expectedWallClockTimestamp);
      
      const expectedWallClockTimeFormatted = formatWallClockTime12h(expectedWallClockDate);

      // Calculate an expected window (e.g. ±15-30s or ±5% window)
      const windowMarginMs = Math.max(15000, Math.round(estimatedSegmentTimeMs * 0.05));
      const windowStartDate = new Date(expectedWallClockTimestamp - windowMarginMs);
      const windowEndDate = new Date(expectedWallClockTimestamp + windowMarginMs);
      const windowStartFormatted = formatWallClockTime12h(windowStartDate);
      const windowEndFormatted = formatWallClockTime12h(windowEndDate);
      const expectedWindowFormatted = `${windowStartFormatted} – ${windowEndFormatted}`;

      const isFinal = normalizeCheckpointType(targetCp.type) === 'finish' || 
        targetCp.id === sortedCheckpoints[sortedCheckpoints.length - 1].id;

      return {
        targetCheckpointId: targetCp.id,
        targetCheckpointName: targetCp.name,
        targetDistanceMeters: targetCp.distanceMeters,
        remainingDistanceMeters: remainingDistMeters,
        estimatedSegmentTimeMs,
        estimatedSegmentTimeFormatted: formatTimeMs(estimatedSegmentTimeMs),
        estimatedRaceElapsedMs,
        estimatedRaceElapsedFormatted: formatTimeMs(estimatedRaceElapsedMs),
        expectedWallClockTimeFormatted,
        expectedWindowFormatted,
        basedOnPaceFormatted: formatPace(paceSecsPerKm),
        basedOnSpeedFormatted: formatSpeed(speedKmh),
        basedOnPaceSecondsPerKm: paceSecsPerKm,
        basedOnSpeedKmh: speedKmh,
        fromCheckpointName: fromName,
        isFinishLine: isFinal,
        hasEnoughData: true
      };
    };

    if (nextCheckpoint && paceSecsPerKm > 0 && speedKmh > 0) {
      nextPrediction = calculatePredictionForTarget(nextCheckpoint);
      if (nextPrediction) {
        hasEnoughDataForEta = true;
      }
    }

    const finalCheckpoint = sortedCheckpoints[sortedCheckpoints.length - 1];
    if (finalCheckpoint && nextCheckpoint && nextCheckpoint.id !== finalCheckpoint.id && paceSecsPerKm > 0) {
      finishPrediction = calculatePredictionForTarget(finalCheckpoint);
    }
  }

  // Construct clear status text
  let statusText = 'Race Ready';
  if (isFinished) {
    statusText = `Runner Finished Race (${formatTimeMs(race.finishTimestamp && race.startTimestamp ? race.finishTimestamp - race.startTimestamp : currentStats.totalTimeMs)})`;
  } else if (isRunning) {
    if (lastRecordedIndex > 0 && lastRecorded) {
      statusText = `Runner reached ${lastRecorded.checkpoint.name}`;
    } else {
      statusText = 'Race Started • Runner en route to first checkpoint';
    }
  }

  return {
    statusText,
    runnerStatusState,
    runnerStatusLabel,
    currentPositionLabel,
    currentDistanceMeters,
    totalDistanceMeters,
    distanceCoveredFormatted,
    latestPaceFormatted,
    latestSpeedFormatted,
    lastSplitTimeFormatted,
    lastUpdatedAt,
    lastUpdatedAtFormatted,
    lastRecordedCheckpoint: lastRecorded,
    lastRecordedIndex,
    lastRecordedEvent,
    nextCheckpoint,
    nextPrediction,
    finishPrediction,
    hasEnoughDataForEta,
    isRaceRunning: isRunning,
    isRaceFinished: isFinished,
    recordedCount: currentStats.recordedCheckpointsCount,
    totalCount: currentStats.totalCheckpointsCount
  };
}

