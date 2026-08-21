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
  | 'splitFinish' 
  | 'splitOnly' 
  | 'finish' 
  // Backward compatibility types
  | 'SPLIT' 
  | 'FINISH' 
  | 'SPLIT_AND_FINISH';

export function normalizeCheckpointType(type?: string): 'splitFinish' | 'splitOnly' | 'finish' {
  if (!type) return 'splitFinish';
  if (type === 'finish' || type === 'FINISH') return 'finish';
  if (type === 'splitOnly' || type === 'SPLIT') return 'splitOnly';
  if (type === 'splitFinish' || type === 'SPLIT_AND_FINISH') return 'splitFinish';
  return 'splitFinish';
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

