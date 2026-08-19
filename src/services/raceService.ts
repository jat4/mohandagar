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
  where 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Race, 
  Checkpoint, 
  TimingEvent, 
  StaffSession, 
  JoinCodeMapping,
  TimingEventType 
} from '../types/race';
import { generateJoinCode } from '../utils/raceCalculations';

export class RaceService {
  /**
   * Create a new race and its join code mappings
   */
  static async createRace(input: {
    name: string;
    runnerName: string;
    runnerBib?: string;
    totalPlannedDistanceMeters: number;
    displayUnit?: 'METERS' | 'KILOMETERS' | 'MILES';
    checkpoints: Array<{
      name: string;
      distanceMeters: number;
      type: 'SPLIT' | 'SPLIT_AND_FINISH';
      assignedStaffName?: string;
    }>;
    notes?: string;
  }): Promise<Race> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be signed in to create a race.');
    }

    const raceId = `race_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Build checkpoints with unique IDs and unique Join Codes
    const checkpoints: Checkpoint[] = input.checkpoints
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .map((cp, idx) => {
        const joinCode = generateJoinCode();
        return {
          id: `cp_${idx + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          order: idx + 1,
          name: cp.name.trim() || `Checkpoint ${idx + 1}`,
          distanceMeters: cp.distanceMeters,
          type: cp.type,
          joinCode,
          assignedStaffName: cp.assignedStaffName?.trim() || ''
        };
      });

    const now = Date.now();
    const race: Race = {
      id: raceId,
      name: input.name.trim(),
      runnerName: input.runnerName.trim(),
      runnerBib: input.runnerBib?.trim() || '101',
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

    try {
      // 1. Save Race Document
      await setDoc(doc(db, 'races', raceId), race);

      // 2. Save Join Code lookups in parallel
      const joinCodePromises = checkpoints.map((cp) => {
        const mapping: JoinCodeMapping = {
          joinCode: cp.joinCode,
          raceId,
          checkpointId: cp.id,
          createdAt: now,
          active: true
        };
        return setDoc(doc(db, 'joinCodes', cp.joinCode.toUpperCase()), mapping);
      });

      await Promise.all(joinCodePromises);
      return race;
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
    const startTimestamp = Date.now();
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

      await setDoc(doc(db, 'races', raceId, 'events', eventId), startEvent);
      return startTimestamp;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `races/${raceId}`);
    }
  }

  /**
   * Record a SPLIT or FINISH timing event
   * Calculates elapsedMs relative to the authoritative start timestamp.
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
  }): Promise<TimingEvent> {
    const now = Date.now();
    const elapsedMs = Math.max(0, now - params.raceStartTimestamp);
    const eventId = `evt_${params.checkpointId}_${now}_${Math.random().toString(36).substring(2, 5)}`;

    const event: TimingEvent = {
      id: eventId,
      raceId: params.raceId,
      checkpointId: params.checkpointId,
      checkpointName: params.checkpointName,
      checkpointDistanceMeters: params.checkpointDistanceMeters,
      timestamp: now,
      elapsedMs,
      recordedByUid: auth.currentUser?.uid || 'staff',
      staffName: params.staffName,
      deviceId: params.deviceId,
      eventType: params.eventType,
      clientRecordedAt: now
    };

    try {
      // 1. Persist immutable event
      await setDoc(doc(db, 'races', params.raceId, 'events', eventId), event);

      // 2. If FINISH event, also update race status
      if (params.eventType === 'FINISH') {
        await updateDoc(doc(db, 'races', params.raceId), {
          status: 'FINISHED',
          finishTimestamp: now,
          updatedAt: now
        });
      }

      return event;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `races/${params.raceId}/events/${eventId}`);
    }
  }

  /**
   * Finish Race manually by Host or Finish device
   */
  static async finishRace(raceId: string): Promise<void> {
    const now = Date.now();
    try {
      await updateDoc(doc(db, 'races', raceId), {
        status: 'FINISHED',
        finishTimestamp: now,
        updatedAt: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `races/${raceId}`);
    }
  }

  /**
   * Reset or Cancel Race
   */
  static async resetRace(raceId: string): Promise<void> {
    const now = Date.now();
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
    const now = Date.now();
    try {
      const sessionRef = doc(db, 'races', raceId, 'staffSessions', sessionId);
      await setDoc(
        sessionRef,
        {
          ...data,
          lastSeenAt: now,
          status: 'ONLINE'
        },
        { merge: true }
      );
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
   * Update Race Checkpoints (before race start)
   */
  static async updateRaceCheckpoints(raceId: string, checkpoints: Checkpoint[]): Promise<void> {
    const now = Date.now();
    try {
      await updateDoc(doc(db, 'races', raceId), {
        checkpoints,
        updatedAt: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `races/${raceId}`);
    }
  }

  /**
   * Delete Race and Associated Join Codes
   */
  static async deleteRace(raceId: string, joinCodes: string[] = []): Promise<void> {
    try {
      await deleteDoc(doc(db, 'races', raceId));
      const codeDeletions = joinCodes.map((code) =>
        deleteDoc(doc(db, 'joinCodes', code.toUpperCase())).catch(() => {})
      );
      await Promise.all(codeDeletions);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `races/${raceId}`);
    }
  }
}
