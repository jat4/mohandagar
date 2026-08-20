/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  limit 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Race, 
  Checkpoint, 
  CheckpointType,
  TimingEvent, 
  StaffSession, 
  JoinCodeMapping,
  TimingEventType,
  PublishedResult,
  PublicationStatus,
  normalizeCheckpointType,
  isSplitAllowed,
  isFinishAllowed
} from '../types/race';
import { generateJoinCode, calculateRaceStatistics } from '../utils/raceCalculations';
import { TimeSyncService } from './timeSyncService';

/**
 * Utility to strip undefined values so Firestore setDoc / updateDoc never fails
 */
function sanitizeFirestorePayload<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = sanitizeFirestorePayload(value);
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map(item => 
          item !== null && typeof item === 'object' ? sanitizeFirestorePayload(item) : item
        );
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}

export class RaceService {
  /**
   * Create a new race and its join code mappings
   */
  static async createRace(input: {
    name: string;
    runnerName: string;
    totalPlannedDistanceMeters: number;
    displayUnit?: 'METERS' | 'KILOMETERS' | 'MILES';
    checkpoints: Array<{
      name: string;
      distanceMeters: number;
      type: CheckpointType;
      assignedStaffName?: string;
    }>;
    notes?: string;
  }): Promise<Race> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be signed in to create a race.');
    }

    const now = TimeSyncService.now();
    const raceId = `race_${now}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Build checkpoints with unique IDs and unique Join Codes
    // Enforce: Final checkpoint must always be 'finish' (Finish Line), normal checkpoints are 'splitFinish' or 'splitOnly'
    const sorted = [...input.checkpoints].sort((a, b) => a.distanceMeters - b.distanceMeters);
    const checkpoints: Checkpoint[] = sorted.map((cp, idx) => {
      const isFinal = idx === sorted.length - 1;
      let enforcedType: CheckpointType;
      if (isFinal) {
        enforcedType = 'finish';
      } else {
        const norm = normalizeCheckpointType(cp.type);
        enforcedType = norm === 'splitOnly' ? 'splitOnly' : 'splitFinish';
      }

      const joinCode = generateJoinCode();
      return {
        id: `cp_${idx + 1}_${now}_${Math.random().toString(36).substring(2, 5)}`,
        order: idx + 1,
        name: cp.name.trim() || (isFinal ? 'FINISH LINE' : `Checkpoint ${idx + 1}`),
        distanceMeters: cp.distanceMeters,
        type: enforcedType,
        joinCode,
        assignedStaffName: cp.assignedStaffName?.trim() || ''
      };
    });

    const raceData: Record<string, any> = {
      id: raceId,
      name: input.name.trim(),
      runnerName: input.runnerName.trim(),
      totalPlannedDistanceMeters: input.totalPlannedDistanceMeters,
      displayUnit: input.displayUnit || 'KILOMETERS',
      status: 'READY',
      hostUid: user.uid,
      hostEmail: user.email || '',
      hostName: user.displayName || user.email?.split('@')[0] || 'Race Host',
      startTimestamp: null,
      finishTimestamp: null,
      createdAt: now,
      updatedAt: now,
      checkpoints,
      notes: input.notes || ''
    };

    const sanitizedRace = sanitizeFirestorePayload(raceData) as Race;

    try {
      // 1. Save Race Document
      await setDoc(doc(db, 'races', raceId), sanitizedRace);

      // 2. Save Join Code lookups in parallel
      const joinCodePromises = checkpoints.map((cp) => {
        const mapping: JoinCodeMapping = {
          joinCode: cp.joinCode,
          raceId,
          checkpointId: cp.id,
          createdAt: now,
          active: true
        };
        return setDoc(doc(db, 'joinCodes', cp.joinCode.toUpperCase()), sanitizeFirestorePayload(mapping));
      });

      await Promise.all(joinCodePromises);
      return sanitizedRace;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `races/${raceId}`);
    }
  }

  /**
   * Fetch single race by ID
   */
  static async getRace(raceId: string): Promise<Race | null> {
    try {
      const snap = await getDoc(doc(db, 'races', raceId));
      if (!snap.exists()) return null;
      return snap.data() as Race;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `races/${raceId}`);
    }
  }

  /**
   * Subscribe to real-time race changes
   */
  static subscribeToRace(
    raceId: string,
    onUpdate: (race: Race | null) => void,
    onError?: (err: any) => void
  ): () => void {
    return onSnapshot(
      doc(db, 'races', raceId),
      (snap) => {
        if (!snap.exists()) {
          onUpdate(null);
        } else {
          onUpdate(snap.data() as Race);
        }
      },
      (error) => {
        console.error('Race subscription error:', error);
        if (onError) onError(error);
      }
    );
  }

  /**
   * Subscribe to real-time immutable timing events
   */
  static subscribeToTimingEvents(
    raceId: string,
    onUpdate: (events: TimingEvent[]) => void,
    onError?: (err: any) => void
  ): () => void {
    const q = query(
      collection(db, 'races', raceId, 'events'),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const events: TimingEvent[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<TimingEvent, 'id'>)
        }));
        onUpdate(events);
      },
      (error) => {
        console.error('Events subscription error:', error);
        if (onError) onError(error);
      }
    );
  }

  /**
   * Subscribe to Staff Sessions / Device Heartbeats
   */
  static subscribeToStaffSessions(
    raceId: string,
    onUpdate: (sessions: StaffSession[]) => void
  ): () => void {
    const q = collection(db, 'races', raceId, 'staffSessions');
    return onSnapshot(
      q,
      (snapshot) => {
        const sessions: StaffSession[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<StaffSession, 'id'>)
        }));
        onUpdate(sessions);
      },
      (err) => console.warn('Staff sessions listener notice:', err)
    );
  }

  /**
   * Authoritative Race Start
   */
  static async startRace(raceId: string): Promise<number> {
    const startTimestamp = TimeSyncService.now();
    try {
      // 1. Update race status and start timestamp
      await updateDoc(doc(db, 'races', raceId), {
        status: 'RUNNING',
        startTimestamp,
        updatedAt: startTimestamp
      });

      // 2. Record START timing event
      const eventId = `evt_start_${startTimestamp}`;
      const startEvent: TimingEvent = {
        id: eventId,
        raceId,
        checkpointId: 'START',
        checkpointName: 'START',
        checkpointDistanceMeters: 0,
        timestamp: startTimestamp,
        elapsedMs: 0,
        recordedByUid: auth.currentUser?.uid || 'host',
        staffName: 'Race Starter',
        deviceId: 'starter_device',
        eventType: 'START',
        clientRecordedAt: startTimestamp
      };

      await setDoc(doc(db, 'races', raceId, 'events', eventId), sanitizeFirestorePayload(startEvent));
      return startTimestamp;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `races/${raceId}`);
    }
  }

  /**
   * Record a SPLIT or FINISH timing event.
   * Accepts authoritative pre-captured timestamp (captured immediately on button press before confirmation dialog).
   * Validates checkpoint type action permissions.
   */
  static async recordTimingEvent(params: {
    raceId: string;
    checkpointId: string;
    checkpointName: string;
    checkpointDistanceMeters: number;
    eventType: TimingEventType;
    staffName: string;
    deviceId: string;
    raceStartTimestamp: number;
    capturedTimestamp?: number;
    capturedElapsedMs?: number;
    checkpointType?: CheckpointType;
  }): Promise<TimingEvent> {
    // 1. Validate checkpoint action permissions against checkpoint type
    const normalizedType = normalizeCheckpointType(params.checkpointType);
    if (params.eventType === 'SPLIT' && !isSplitAllowed(normalizedType)) {
      throw new Error(`Checkpoint type "${normalizedType}" does not allow recording SPLIT events.`);
    }
    if (params.eventType === 'FINISH' && !isFinishAllowed(normalizedType)) {
      throw new Error(`Checkpoint type "${normalizedType}" does not allow recording FINISH events.`);
    }

    // 2. Authoritative timing: Use pre-captured timestamp (from initial FINISH button press),
    // or current authoritative time via TimeSyncService
    const eventTime = params.capturedTimestamp ?? TimeSyncService.now();
    const elapsedMs = params.capturedElapsedMs ?? Math.max(0, eventTime - params.raceStartTimestamp);
    const eventId = `evt_${params.checkpointId}_${eventTime}_${Math.random().toString(36).substring(2, 5)}`;

    const event: TimingEvent = {
      id: eventId,
      raceId: params.raceId,
      checkpointId: params.checkpointId,
      checkpointName: params.checkpointName,
      checkpointDistanceMeters: params.checkpointDistanceMeters,
      timestamp: eventTime,
      elapsedMs,
      recordedByUid: auth.currentUser?.uid || 'staff',
      staffName: params.staffName,
      deviceId: params.deviceId,
      eventType: params.eventType,
      clientRecordedAt: eventTime
    };

    try {
      // Persist immutable event with the exact captured timestamp
      await setDoc(doc(db, 'races', params.raceId, 'events', eventId), sanitizeFirestorePayload(event));

      // If FINISH event, also update race status with the exact finish timestamp
      if (params.eventType === 'FINISH') {
        await updateDoc(doc(db, 'races', params.raceId), {
          status: 'FINISHED',
          finishTimestamp: eventTime,
          updatedAt: TimeSyncService.now()
        });
      }

      return event;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `races/${params.raceId}/events/${eventId}`);
    }
  }

  /**
   * Finish Race manually by Host or Finish device.
   * Accepts authoritative pre-captured timestamp so confirmation modal delay has zero effect.
   */
  static async finishRace(raceId: string, finishTimestamp?: number): Promise<void> {
    const finalTimestamp = finishTimestamp ?? TimeSyncService.now();
    try {
      await updateDoc(doc(db, 'races', raceId), {
        status: 'FINISHED',
        finishTimestamp: finalTimestamp,
        updatedAt: TimeSyncService.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `races/${raceId}`);
    }
  }

  /**
   * Reset or Cancel Race
   */
  static async resetRace(raceId: string): Promise<void> {
    const now = TimeSyncService.now();
    try {
      await updateDoc(doc(db, 'races', raceId), {
        status: 'READY',
        startTimestamp: null,
        finishTimestamp: null,
        updatedAt: now
      });

      // Clear existing events
      const eventsSnap = await getDocs(collection(db, 'races', raceId, 'events'));
      const deletePromises = eventsSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `races/${raceId}`);
    }
  }

  /**
   * Update or Create Staff Session Heartbeat
   */
  static async updateStaffHeartbeat(
    raceId: string,
    sessionId: string,
    data: Partial<StaffSession>
  ): Promise<void> {
    const now = TimeSyncService.now();
    try {
      const sessionRef = doc(db, 'races', raceId, 'staffSessions', sessionId);
      const payload = sanitizeFirestorePayload({
        ...data,
        lastSeenAt: now,
        status: 'ONLINE'
      });
      await setDoc(sessionRef, payload, { merge: true });
    } catch (err) {
      console.warn('Heartbeat update notice:', err);
    }
  }

  /**
   * Resolve Join Code (e.g. "8K4P-29") to Race & Checkpoint
   */
  static async resolveJoinCode(joinCode: string): Promise<JoinCodeMapping | null> {
    const cleanedCode = joinCode.trim().toUpperCase();
    try {
      const snap = await getDoc(doc(db, 'joinCodes', cleanedCode));
      if (!snap.exists()) return null;
      return snap.data() as JoinCodeMapping;
    } catch (error) {
      console.error('Resolve join code error:', error);
      return null;
    }
  }

  /**
   * Find Race and Checkpoint by checkpointId
   */
  static async getRaceByCheckpointId(checkpointId: string, hintRaceId?: string): Promise<{ race: Race; checkpoint: Checkpoint } | null> {
    try {
      // 1. If hintRaceId is supplied, check directly
      if (hintRaceId) {
        const race = await this.getRace(hintRaceId);
        if (race) {
          const cp = race.checkpoints.find(c => c.id === checkpointId);
          if (cp) return { race, checkpoint: cp };
        }
      }

      // 2. Query recent races to locate this checkpoint
      const q = query(collection(db, 'races'), orderBy('createdAt', 'desc'), limit(30));
      const snaps = await getDocs(q);
      for (const d of snaps.docs) {
        const race = d.data() as Race;
        const cp = race.checkpoints?.find(c => c.id === checkpointId);
        if (cp) {
          return { race, checkpoint: cp };
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding checkpoint by ID:', error);
      return null;
    }
  }

  /**
   * Update Race Checkpoints (before race start)
   */
  static async updateRaceCheckpoints(raceId: string, checkpoints: Checkpoint[]): Promise<void> {
    const now = TimeSyncService.now();
    const sorted = [...checkpoints].sort((a, b) => a.distanceMeters - b.distanceMeters);
    const sanitized = sorted.map((cp, idx) => {
      const isFinal = idx === sorted.length - 1;
      let enforcedType: CheckpointType;
      if (isFinal) {
        enforcedType = 'finish';
      } else {
        const norm = normalizeCheckpointType(cp.type);
        enforcedType = norm === 'splitOnly' ? 'splitOnly' : 'splitFinish';
      }
      return sanitizeFirestorePayload({
        ...cp,
        order: idx + 1,
        type: enforcedType
      });
    });

    try {
      await updateDoc(doc(db, 'races', raceId), {
        checkpoints: sanitized,
        updatedAt: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `races/${raceId}`);
    }
  }

  /**
   * Subscribe to list of races created by Host (History)
   */
  static subscribeToHostRaces(
    hostUid: string | undefined,
    onUpdate: (races: Race[]) => void,
    onError?: (err: any) => void
  ): () => void {
    const racesRef = collection(db, 'races');
    const q = hostUid
      ? query(racesRef, where('hostUid', '==', hostUid), orderBy('createdAt', 'desc'))
      : query(racesRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snap) => {
        const races: Race[] = [];
        snap.forEach((d) => {
          races.push(d.data() as Race);
        });
        onUpdate(races);
      },
      (error) => {
        console.warn('Host races query warning:', error);
        // Fallback without orderBy index if needed
        const simpleQ = hostUid
          ? query(racesRef, where('hostUid', '==', hostUid))
          : racesRef;
        return onSnapshot(
          simpleQ,
          (s) => {
            const list: Race[] = [];
            s.forEach((d) => list.push(d.data() as Race));
            list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            onUpdate(list);
          },
          (err2) => {
            if (onError) onError(err2);
          }
        );
      }
    );
  }

  /**
   * Delete Race and all its subcollections and join codes permanently
   */
  static async deleteRace(raceId: string, joinCodes: string[] = []): Promise<void> {
    try {
      // 1. Delete all events subcollection documents
      const eventsSnap = await getDocs(collection(db, 'races', raceId, 'events'));
      const eventDeletions = eventsSnap.docs.map((d) => deleteDoc(d.ref).catch(() => {}));
      await Promise.all(eventDeletions);

      // 2. Delete all staffSessions subcollection documents
      const sessionsSnap = await getDocs(collection(db, 'races', raceId, 'staffSessions'));
      const sessionDeletions = sessionsSnap.docs.map((d) => deleteDoc(d.ref).catch(() => {}));
      await Promise.all(sessionDeletions);

      // 3. Delete joinCodes mappings
      const codeDeletions = joinCodes.map((code) =>
        deleteDoc(doc(db, 'joinCodes', code.toUpperCase())).catch(() => {})
      );
      await Promise.all(codeDeletions);

      // 4. Delete root race document
      await deleteDoc(doc(db, 'races', raceId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `races/${raceId}`);
    }
  }

  /**
   * Publish or re-publish a finished race's authoritative result snapshot
   */
  static async publishRaceResult(race: Race, events: TimingEvent[]): Promise<PublishedResult> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be signed in as host to publish race results.');
    }
    if (race.hostUid !== user.uid) {
      throw new Error('Only the race creator can publish this race result.');
    }
    if (race.status !== 'FINISHED') {
      throw new Error('Only finished races can be published.');
    }

    const now = TimeSyncService.now();
    const stats = calculateRaceStatistics(race, events);

    const publishedResultData: PublishedResult = {
      id: race.id,
      raceId: race.id,
      raceName: race.name,
      runnerName: race.runnerName,
      hostUid: race.hostUid,
      hostName: race.hostName || user.displayName || 'Race Host',
      publishedAt: now,
      updatedAt: now,
      resultStatus: 'PUBLISHED',
      totalPlannedDistanceMeters: stats.totalPlannedDistanceMeters,
      actualDistanceMeters: stats.actualDistanceMeters,
      actualDistanceKm: stats.actualDistanceKm,
      totalTimeMs: stats.totalTimeMs,
      totalTimeFormatted: stats.totalTimeFormatted,
      averagePaceSecondsPerKm: stats.averagePaceSecondsPerKm,
      averagePaceFormatted: stats.averagePaceFormatted,
      averageSpeedKmh: stats.averageSpeedKmh,
      averageSpeedFormatted: stats.averageSpeedFormatted,
      bestSplit: stats.bestSplit || null,
      slowestSplit: stats.slowestSplit || null,
      processedCheckpoints: stats.processedCheckpoints,
      measuredSegments: stats.measuredSegments,
      dateFormatted: stats.dateFormatted,
      recordedCheckpointsCount: stats.recordedCheckpointsCount,
      missedCheckpointsCount: stats.missedCheckpointsCount,
      totalCheckpointsCount: stats.totalCheckpointsCount,
      notes: race.notes || ''
    };

    const sanitized = sanitizeFirestorePayload(publishedResultData);

    try {
      await setDoc(doc(db, 'publishedResults', race.id), sanitized);
      return sanitized;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `publishedResults/${race.id}`);
    }
  }

  /**
   * Unpublish a race result (marks resultStatus = 'UNPUBLISHED')
   */
  static async unpublishRaceResult(raceId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be signed in to unpublish.');
    const now = TimeSyncService.now();

    try {
      await updateDoc(doc(db, 'publishedResults', raceId), {
        resultStatus: 'UNPUBLISHED',
        updatedAt: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `publishedResults/${raceId}`);
    }
  }

  /**
   * Delete a published race result (marks resultStatus = 'DELETED')
   */
  static async deleteRaceResult(raceId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be signed in to delete result.');
    const now = TimeSyncService.now();

    try {
      await updateDoc(doc(db, 'publishedResults', raceId), {
        resultStatus: 'DELETED',
        updatedAt: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `publishedResults/${raceId}`);
    }
  }

  /**
   * Fetch single published result by ID
   */
  static async getPublishedResult(resultId: string): Promise<PublishedResult | null> {
    try {
      const snap = await getDoc(doc(db, 'publishedResults', resultId));
      if (!snap.exists()) return null;
      return snap.data() as PublishedResult;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `publishedResults/${resultId}`);
    }
  }

  /**
   * Subscribe to a single published result document
   */
  static subscribeToPublishedResult(
    resultId: string,
    onUpdate: (result: PublishedResult | null) => void,
    onError?: (err: any) => void
  ): () => void {
    return onSnapshot(
      doc(db, 'publishedResults', resultId),
      (snap) => {
        if (!snap.exists()) {
          onUpdate(null);
        } else {
          onUpdate(snap.data() as PublishedResult);
        }
      },
      (error) => {
        console.warn('Published result subscription warning:', error);
        if (onError) onError(error);
      }
    );
  }

  /**
   * Subscribe to all public published race results (resultStatus == 'PUBLISHED')
   */
  static subscribeToPublishedResults(
    onUpdate: (results: PublishedResult[]) => void,
    onError?: (err: any) => void
  ): () => void {
    const resultsRef = collection(db, 'publishedResults');
    const q = query(
      resultsRef,
      where('resultStatus', '==', 'PUBLISHED'),
      orderBy('publishedAt', 'desc'),
      limit(50)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: PublishedResult[] = snapshot.docs.map((d) => d.data() as PublishedResult);
        onUpdate(list);
      },
      (error) => {
        console.warn('Published results index warning, falling back without orderBy:', error);
        // Fallback without compound order index if not created yet
        const fallbackQ = query(
          resultsRef,
          where('resultStatus', '==', 'PUBLISHED')
        );
        return onSnapshot(
          fallbackQ,
          (snap) => {
            const list: PublishedResult[] = snap.docs.map((d) => d.data() as PublishedResult);
            list.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
            onUpdate(list);
          },
          (err2) => {
            if (onError) onError(err2);
          }
        );
      }
    );
  }
}
