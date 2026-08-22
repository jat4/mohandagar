export type RaceStatus = 'SETUP' | 'READY' | 'WAITING' | 'RUNNING' | 'FINISHED' | 'CANCELLED';

export function isRaceRunning(status?: string): boolean {
  if (!status) return false;
  const s = status.trim().toUpperCase();
  return s === 'RUNNING';
}

export function isRaceFinished(status?: string): boolean {
  if (!status) return false;
  const s = status.trim().toUpperCase();
  return s === 'FINISHED' || s === 'COMPLETED';
}

export function isRaceWaiting(status?: string): boolean {
  if (!status) return true;
  const s = status.trim().toUpperCase();
  return s === 'WAITING' || s === 'READY' || s === 'SETUP';
}

export type DistanceUnit = 'METERS' | 'KILOMETERS' | 'MILES';

export type CheckpointType = 
  | 'start'
  | 'splitFinish' 
  | 'splitOnly' 
  | 'finish' 
  // Backward compatibility types
  | 'START'
  | 'SPLIT' 
  | 'FINISH' 
  | 'SPLIT_AND_FINISH';

export function normalizeCheckpointType(type?: string): 'start' | 'splitFinish' | 'splitOnly' | 'finish' {
  if (!type) return 'splitFinish';
  if (type === 'start' || type === 'START') return 'start';
  if (type === 'finish' || type === 'FINISH') return 'finish';
  if (type === 'splitOnly' || type === 'SPLIT') return 'splitOnly';
  if (type === 'splitFinish' || type === 'SPLIT_AND_FINISH') return 'splitFinish';
  return 'splitFinish';
}

export function isStartAllowed(type?: string): boolean {
  const norm = normalizeCheckpointType(type);
  return norm === 'start';
}

export function isSplitAllowed(type?: string): boolean {
  const norm = normalizeCheckpointType(type);
  return norm === 'splitFinish' || norm === 'splitOnly';
}

export function isFinishAllowed(type?: string): boolean {
  const norm = normalizeCheckpointType(type);
  return norm === 'splitFinish' || norm === 'finish';
}

export type TimingEventType = 'START' | 'SPLIT' | 'FINISH';

export type DeviceConnectionStatus = 'ONLINE' | 'OFFLINE';

export interface Checkpoint {
  id: string;
  order: number;
  name: string;
  distanceMeters: number;
  type: CheckpointType;
  joinCode: string;
  assignedStaffName?: string;
  assignedStaffUid?: string;
  assignedDeviceId?: string;
  assignedDeviceName?: string;
  isHostAssigned?: boolean;
  isStart?: boolean;
}

export interface Race {
  id: string;
  name: string;
  runnerName: string;
  runnerGender?: 'MALE' | 'FEMALE';
  runnerAge?: number;
  runnerCity?: string;
  runnerState?: string;
  totalPlannedDistanceMeters: number;
  displayUnit: DistanceUnit;
  status: RaceStatus;
  hostUid: string;
  hostEmail?: string;
  hostName?: string;
  startTimestamp?: number | null; // Milliseconds epoch of authoritative race start
  finishTimestamp?: number | null; // Milliseconds epoch of finish
  createdAt: number;
  updatedAt: number;
  checkpoints: Checkpoint[];
  hostAssignedCheckpointId?: string | null; // If Host assigned himself to a CP or Start
  notes?: string;
}

export interface TimingEvent {
  id: string;
  raceId: string;
  runnerId?: string;
  checkpointId: string;
  checkpointName: string;
  checkpointDistanceMeters: number;
  timestamp: number; // Server epoch timestamp
  elapsedMs: number; // Authoritative elapsed ms since race start
  recordedByUid: string;
  staffName: string;
  deviceId: string;
  eventType: TimingEventType;
  isMissedFallback?: boolean;
  clientRecordedAt?: number;
}

export interface StaffSession {
  id: string;
  raceId: string;
  checkpointId: string;
  checkpointName: string;
  checkpointDistanceMeters: number;
  staffName: string;
  deviceName: string;
  joinedAt: number;
  lastSeenAt: number;
  status: DeviceConnectionStatus;
  isHost?: boolean;
}

export interface JoinCodeMapping {
  joinCode: string;
  raceId: string;
  checkpointId: string;
  createdAt: number;
  active: boolean;
}

export interface MeasuredSegment {
  fromCheckpointName: string;
  fromCheckpointId: string;
  fromDistanceMeters: number;
  fromElapsedMs: number;
  toCheckpointName: string;
  toCheckpointId: string;
  toDistanceMeters: number;
  toElapsedMs: number;
  segmentDistanceMeters: number;
  segmentDistanceKm: number;
  segmentTimeSeconds: number;
  segmentElapsedMs: number;
  segmentPaceSecondsPerKm: number;
  segmentPaceFormatted: string; // MM:SS/km
  segmentSpeedKmh: number;
  segmentSpeedFormatted: string; // XX.XX km/h
  isMultiCheckpointSpan: boolean;
  missedCheckpointsCount: number;
  missedCheckpointNames: string[];
}

export interface ProcessedCheckpointResult {
  checkpoint: Checkpoint;
  status: 'RECORDED' | 'MISSED' | 'PENDING' | 'UPCOMING';
  event?: TimingEvent;
  cumulativeDistanceMeters: number;
  cumulativeDistanceKm: number;
  cumulativeElapsedMs?: number;
  cumulativeElapsedFormatted?: string;
  cumulativePaceSecondsPerKm?: number;
  cumulativePaceFormatted?: string;
  cumulativeSpeedKmh?: number;
  cumulativeSpeedFormatted?: string;
  segment?: MeasuredSegment;
}

export interface RaceStatistics {
  raceName: string;
  runnerName: string;
  dateFormatted: string;
  status: RaceStatus;
  totalPlannedDistanceMeters: number;
  actualDistanceMeters: number;
  actualDistanceKm: number;
  totalTimeMs: number;
  totalTimeFormatted: string;
  averagePaceSecondsPerKm: number;
  averagePaceFormatted: string;
  averageSpeedKmh: number;
  averageSpeedFormatted: string;
  bestSplit?: MeasuredSegment | null;
  slowestSplit?: MeasuredSegment | null;
  processedCheckpoints: ProcessedCheckpointResult[];
  measuredSegments: MeasuredSegment[];
  missedCheckpointsCount: number;
  recordedCheckpointsCount: number;
  totalCheckpointsCount: number;
}

export type PublicationStatus = 'UNPUBLISHED' | 'PUBLISHED' | 'DELETED';

export interface PublishedResult {
  id: string; // Typically equal to raceId
  raceId: string;
  raceName: string;
  runnerName: string;
  runnerGender?: 'MALE' | 'FEMALE';
  runnerAge?: number;
  runnerCity?: string;
  runnerState?: string;
  hostUid: string;
  hostName?: string;
  publishedAt: number;
  updatedAt: number;
  resultStatus: PublicationStatus;
  totalPlannedDistanceMeters: number;
  actualDistanceMeters: number;
  actualDistanceKm: number;
  totalTimeMs: number;
  totalTimeFormatted: string;
  averagePaceSecondsPerKm: number;
  averagePaceFormatted: string;
  averageSpeedKmh: number;
  averageSpeedFormatted: string;
  bestSplit?: MeasuredSegment | null;
  slowestSplit?: MeasuredSegment | null;
  processedCheckpoints: ProcessedCheckpointResult[];
  measuredSegments: MeasuredSegment[];
  dateFormatted: string;
  recordedCheckpointsCount: number;
  missedCheckpointsCount: number;
  totalCheckpointsCount: number;
  notes?: string;
}

export interface CheckpointPrediction {
  targetCheckpointId: string;
  targetCheckpointName: string;
  targetDistanceMeters: number;
  remainingDistanceMeters: number;
  estimatedSegmentTimeMs: number;
  estimatedSegmentTimeFormatted: string; // e.g. "00:00.39"
  estimatedRaceElapsedMs: number;
  estimatedRaceElapsedFormatted: string; // e.g. "00:12.100"
  expectedWallClockTimeFormatted: string; // e.g. "18:42:31"
  basedOnPaceFormatted: string; // e.g. "3:14/km"
  basedOnSpeedFormatted: string; // e.g. "18.50 km/h"
  basedOnPaceSecondsPerKm: number;
  basedOnSpeedKmh: number;
  fromCheckpointName: string;
  isFinishLine: boolean;
}

export interface LiveRunnerProgress {
  statusText: string;
  lastRecordedCheckpoint: ProcessedCheckpointResult | null;
  lastRecordedIndex: number;
  lastRecordedEvent: TimingEvent | null;
  nextCheckpoint: Checkpoint | null;
  nextPrediction: CheckpointPrediction | null;
  finishPrediction: CheckpointPrediction | null;
  isRaceRunning: boolean;
  isRaceFinished: boolean;
  recordedCount: number;
  totalCount: number;
}

/**
 * Checks if a string represents an unassigned placeholder value (e.g. empty string or "unassigned").
 * Real staff names (including names like "Start Line", "Start Line1", "Finish Line", "CP1", etc.)
 * are valid user identities and must NEVER be confused with or rejected as checkpoint metadata.
 */
export function isPlaceholderStaffName(name?: string, _checkpointName?: string): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (
    !trimmed || 
    trimmed === '—' || 
    trimmed === '-' || 
    trimmed.toLowerCase() === 'unassigned' || 
    trimmed.toLowerCase() === 'none' || 
    trimmed.toLowerCase() === 'no staff' ||
    trimmed.toLowerCase() === 'no device'
  ) {
    return true;
  }
  return false;
}

export interface CheckpointRoleInfo {
  typeDisplayName: string;
  authorityDescription: string;
  badgeClass: string;
}

/**
 * Returns dynamic role and authority description strictly corresponding to authoritative checkpoint configuration.
 * START LINE -> START ONLY / Establish official race start
 * SPLIT ONLY -> SPLIT ONLY / Record runner splits
 * SPLIT & FINISH -> SPLIT & FINISH / Record split and finish timing
 * FINISH LINE -> FINISH ONLY / Record official finish time
 */
export function getCheckpointRoleInfo(checkpoint?: Checkpoint | null): CheckpointRoleInfo {
  if (!checkpoint) {
    return {
      typeDisplayName: 'SPLIT ONLY',
      authorityDescription: 'Record runner splits',
      badgeClass: 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
    };
  }

  const normType = normalizeCheckpointType(checkpoint.type);
  const isStart = normType === 'start' || checkpoint.isStart || (checkpoint.distanceMeters === 0 && checkpoint.order === 0);
  const isFinish = !isStart && normType === 'finish';
  const isSplitFinish = !isStart && !isFinish && normType === 'splitFinish';

  if (isStart) {
    return {
      typeDisplayName: 'START ONLY',
      authorityDescription: 'Establish official race start',
      badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
    };
  }

  if (isFinish) {
    return {
      typeDisplayName: 'FINISH ONLY',
      authorityDescription: 'Record official finish time',
      badgeClass: 'bg-rose-950 text-rose-300 border-rose-500/40'
    };
  }

  if (isSplitFinish) {
    return {
      typeDisplayName: 'SPLIT & FINISH',
      authorityDescription: 'Record split and finish timing',
      badgeClass: 'bg-amber-950 text-amber-300 border-amber-500/40'
    };
  }

  return {
    typeDisplayName: 'SPLIT ONLY',
    authorityDescription: 'Record runner splits',
    badgeClass: 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
  };
}

export interface ActiveCheckpointAssignment {
  isOccupied: boolean;
  staffName: string;
  deviceName?: string;
  staffUid?: string;
  isHost?: boolean;
}

/**
 * Returns the current active assignment for a checkpoint.
 * Strictly separates checkpoint metadata (name, role, default label) from REAL active assignments.
 */
export function getActiveCheckpointAssignment(
  checkpoint?: Checkpoint | null,
  staffSessions?: StaffSession[]
): ActiveCheckpointAssignment {
  if (!checkpoint) {
    return { isOccupied: false, staffName: '' };
  }

  const normType = normalizeCheckpointType(checkpoint.type);
  const isStart = normType === 'start' || checkpoint.isStart || (checkpoint.distanceMeters === 0 && checkpoint.name?.toUpperCase().includes('START'));

  // 1. Host assignment check
  if (checkpoint.isHostAssigned) {
    const rawStaffName = checkpoint.assignedStaffName?.trim();
    const hostDisplayName = rawStaffName && !isPlaceholderStaffName(rawStaffName)
      ? rawStaffName
      : 'Host';
    return {
      isOccupied: true,
      staffName: hostDisplayName.includes('(Host)') ? hostDisplayName : `${hostDisplayName} (Host)`,
      deviceName: checkpoint.assignedDeviceName || 'Host Device',
      staffUid: checkpoint.assignedStaffUid,
      isHost: true
    };
  }

  // 2. Direct checkpoint fields check (assignedStaffUid or real assignedStaffName)
  const rawStaffName = checkpoint.assignedStaffName?.trim();
  const hasRealStaffName = Boolean(rawStaffName && !isPlaceholderStaffName(rawStaffName));
  const hasStaffUid = Boolean(checkpoint.assignedStaffUid && checkpoint.assignedStaffUid.trim() !== '');

  if (hasRealStaffName || hasStaffUid) {
    return {
      isOccupied: true,
      staffName: hasRealStaffName ? rawStaffName! : 'Staff Member',
      deviceName: checkpoint.assignedDeviceName || 'Staff Device',
      staffUid: checkpoint.assignedStaffUid,
      isHost: false
    };
  }

  // 3. Active staff sessions in Firestore (from live connected devices)
  if (staffSessions && staffSessions.length > 0) {
    const matchingSessions = staffSessions.filter(s => 
      s.checkpointId === checkpoint.id || 
      (isStart && (s.checkpointId === 'START' || s.checkpointName?.toUpperCase().includes('START')))
    );
    const session = matchingSessions.sort((a, b) => (b.lastSeenAt || b.joinedAt || 0) - (a.lastSeenAt || a.joinedAt || 0))[0];

    if (session && session.staffName && !isPlaceholderStaffName(session.staffName)) {
      return {
        isOccupied: true,
        staffName: session.staffName,
        deviceName: session.deviceName || 'Staff Device',
        isHost: Boolean(session.isHost)
      };
    }
  }

  return {
    isOccupied: false,
    staffName: ''
  };
}

/**
 * Convenience helper to check if a checkpoint has a valid active assignment.
 */
export function hasValidActiveAssignment(
  checkpoint?: Checkpoint | null,
  staffSessions?: StaffSession[]
): boolean {
  return getActiveCheckpointAssignment(checkpoint, staffSessions).isOccupied;
}

/**
 * Formats clean, professional error messages for UI display without exposing internal backend / auth info.
 */
export function formatCleanErrorMessage(err: any, fallbackMessage: string = 'An unexpected error occurred.'): string {
  if (!err) return fallbackMessage;
  let rawMsg = typeof err === 'string' ? err : err.message || String(err);

  // If it's a JSON stringified FirestoreErrorInfo or raw error object
  if (rawMsg.startsWith('{') && rawMsg.endsWith('}')) {
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed.error) {
        rawMsg = parsed.error;
      }
    } catch {
      // ignore
    }
  }

  // Clean known permission and connectivity errors
  if (rawMsg.includes('permission-denied') || rawMsg.includes('Missing or insufficient permissions')) {
    return 'Permission denied. Please make sure you are signed in with the correct account.';
  }
  if (rawMsg.includes('unavailable') || rawMsg.includes('client is offline')) {
    return 'Network connection is offline. Please check your internet connection.';
  }
  if (rawMsg.includes('not-found')) {
    return 'The requested race or checkpoint could not be found.';
  }

  // If it contains raw authInfo or internal paths, strip them
  if (rawMsg.includes('authInfo') || rawMsg.includes('providerInfo') || rawMsg.includes('operationType')) {
    return fallbackMessage;
  }

  return rawMsg;
}

