export type RaceStatus = 'SETUP' | 'READY' | 'RUNNING' | 'FINISHED' | 'CANCELLED';

export type DistanceUnit = 'METERS' | 'KILOMETERS' | 'MILES';

export type CheckpointType = 'SPLIT' | 'SPLIT_AND_FINISH';

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
  runnerBib: string;
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
  runnerBib: string;
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
