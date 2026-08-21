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
    runnerGender?: 'MALE' | 'FEMALE';
    runnerAge?: number;
    runnerCity?: string;
    runnerState?: string;
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
    
    // Separate START LINE, normal checkpoints, and FINISH LINE
    // Rule:
    // Order: START LINE (0m, type 'start', isStart: true)
    //        ↓ Checkpoints 1..N (type 'splitFinish' | 'splitOnly')
    //        ↓ FINISH LINE (planned distance, type 'finish')
    const rawCheckpoints = input.checkpoints || [];
    const hasExplicitStart = rawCheckpoints.some(
      cp => normalizeCheckpointType(cp.type) === 'start' || cp.distanceMeters === 0 || cp.name.toUpperCase().includes('START')
    );

    let startCpInput = rawCheckpoints.find(
      cp => normalizeCheckpointType(cp.type) === 'start' || cp.distanceMeters === 0 || cp.name.toUpperCase().includes('START')
    );

    if (!startCpInput) {
      startCpInput = {
        name: 'START LINE',
        distanceMeters: 0,
        type: 'start',
        assignedStaffName: 'Start Line'
      };
    }

    const nonStartCheckpoints = rawCheckpoints.filter(
      cp => cp !== startCpInput && cp.distanceMeters > 0 && normalizeCheckpointType(cp.type) !== 'start'
    );

    const sortedMiddle = [...nonStartCheckpoints].sort((a, b) => a.distanceMeters - b.distanceMeters);

    // If there are no checkpoints provided at all besides start, add default Finish Line
    let finishCpInput = sortedMiddle.length > 0 ? sortedMiddle[sortedMiddle.length - 1] : null;
    let middleWithoutFinish = sortedMiddle;

    if (finishCpInput && (normalizeCheckpointType(finishCpInput.type) === 'finish' || finishCpInput.distanceMeters >= input.totalPlannedDistanceMeters)) {
      middleWithoutFinish = sortedMiddle.slice(0, -1);
    } else {
      finishCpInput = {
        name: 'FINISH LINE',
        distanceMeters: input.totalPlannedDistanceMeters,
        type: 'finish',
        assignedStaffName: 'Finish Line'
      };
    }

    const allOrderedInputs = [
      {
        name: 'START LINE',
        distanceMeters: 0,
        type: 'start' as CheckpointType,
        isStart: true,
        assignedStaffName: startCpInput.assignedStaffName || 'Start Line'
      },
      ...middleWithoutFinish.map((cp, idx) => ({
        name: cp.name.trim() || `CP ${idx + 1}`,
        distanceMeters: cp.distanceMeters,
        type: (normalizeCheckpointType(cp.type) === 'splitOnly' ? 'splitOnly' : 'splitFinish') as CheckpointType,
        isStart: false,
        assignedStaffName: cp.assignedStaffName?.trim() || ''
      })),
      {
        name: finishCpInput.name.trim() || 'FINISH LINE',
        distanceMeters: input.totalPlannedDistanceMeters,
        type: 'finish' as CheckpointType,
        isStart: false,
        assignedStaffName: finishCpInput.assignedStaffName?.trim() || 'Finish Line'
      }
    ];

    const checkpoints: Checkpoint[] = allOrderedInputs.map((cp, idx) => {
      const joinCode = generateJoinCode();
      return {
        id: `cp_${idx + 1}_${now}_${Math.random().toString(36).substring(2, 5)}`,
        order: idx + 1,
        name: cp.name,
        distanceMeters: cp.distanceMeters,
        type: cp.type,
        isStart: cp.isStart,
        joinCode,
        assignedStaffName: cp.assignedStaffName
      };
    });

    const raceData: Record<string, any> = {
      id: raceId,
      name: input.name.trim(),
      runnerName: input.runnerName.trim(),
      runnerGender: input.runnerGender || 'MALE',
      runnerAge: input.runnerAge !== undefined && !isNaN(Number(input.runnerAge)) ? Number(input.runnerAge) : undefined,
      runnerCity: input.runnerCity?.trim() || '',
      runnerState: input.runnerState?.trim() || '',
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

      // 2. Save Join Code lookups in parallel (both with dash and without dash)
      const joinCodePromises: Promise<any>[] = [];
      checkpoints.forEach((cp) => {
        const mapping: JoinCodeMapping = {
          joinCode: cp.joinCode,
          raceId,
          checkpointId: cp.id,
          createdAt: now,
          active: true
        };
        const rawCode = cp.joinCode.toUpperCase();
        const noDashCode = cp.joinCode.replace(/-/g, '').toUpperCase();

        joinCodePromises.push(setDoc(doc(db, 'joinCodes', rawCode), sanitizeFirestorePayload(mapping)));
        if (noDashCode !== rawCode) {
          joinCodePromises.push(setDoc(doc(db, 'joinCodes', noDashCode), sanitizeFirestorePayload(mapping)));
        }
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
  static async startRace(
    raceId: string, 
    options?: {
      startCheckpointId?: string;
      staffName?: string;
      deviceId?: string;
      startTimestamp?: number;
    }
  ): Promise<number> {
    const startTimestamp = options?.startTimestamp ?? TimeSyncService.now();
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
        checkpointId: options?.startCheckpointId || 'START',
        checkpointName: 'START LINE',
        checkpointDistanceMeters: 0,
        timestamp: startTimestamp,
        elapsedMs: 0,
        recordedByUid: auth.currentUser?.uid || 'starter',
        staffName: options?.staffName || (auth.currentUser?.displayName || 'Race Starter'),
        deviceId: options?.deviceId || 'starter_device',
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
   * Assign Host to any checkpoint (Start Line, normal CP, or Finish Line)
   */
  static async assignHostToCheckpoint(
    raceId: string,
    checkpointId: string,
    hostName?: string,
    hostUid?: string
  ): Promise<void> {
    const user = auth.currentUser;
    const uid = hostUid || user?.uid || 'host';
    const name = hostName || user?.displayName || user?.email?.split('@')[0] || 'Host';
    const now = TimeSyncService.now();

    const race = await this.getRace(raceId);
    if (!race) throw new Error('Race not found.');

    // Update checkpoints: only the selected checkpoint has isHostAssigned = true
    const updatedCheckpoints = (race.checkpoints || []).map((cp) => {
      if (cp.id === checkpointId) {
        return {
          ...cp,
          isHostAssigned: true,
          assignedStaffName: `${name} (Host)`,
          assignedStaffUid: uid
        };
      }
      // Clear previous host assignment from other checkpoints if any
      if (cp.isHostAssigned || cp.assignedStaffUid === uid) {
        return {
          ...cp,
          isHostAssigned: false,
          assignedStaffName: '',
          assignedStaffUid: ''
        };
      }
      return cp;
    });

    const targetCp = updatedCheckpoints.find((cp) => cp.id === checkpointId);

    try {
      await updateDoc(doc(db, 'races', raceId), {
        checkpoints: updatedCheckpoints.map((cp) => sanitizeFirestorePayload(cp)),
        hostAssignedCheckpointId: checkpointId,
        updatedAt: now
      });

      // Record a staffSession for the Host so real-time devices see it immediately
      if (targetCp) {
        const sessionId = `session_host_${raceId}_${uid}`;
        const session: StaffSession = {
          id: sessionId,
          raceId,
          checkpointId: targetCp.id,
          checkpointName: targetCp.name,
          checkpointDistanceMeters: targetCp.distanceMeters,
          staffName: `${name} (Host)`,
          deviceName: 'Host Device',
          joinedAt: now,
          lastSeenAt: now,
          status: 'ONLINE',
          isHost: true
        };
        await setDoc(doc(db, 'races', raceId, 'staffSessions', sessionId), sanitizeFirestorePayload(session), { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `races/${raceId}`);
    }
  }

  /**
   * Unassign Host from current checkpoint
   */
  static async unassignHostFromCheckpoint(raceId: string, hostUid?: string): Promise<void> {
    const user = auth.currentUser;
    const uid = hostUid || user?.uid || 'host';
    const now = TimeSyncService.now();

    const race = await this.getRace(raceId);
    if (!race) return;

    const updatedCheckpoints = (race.checkpoints || []).map((cp) => {
      if (cp.isHostAssigned || cp.assignedStaffUid === uid) {
        return {
          ...cp,
          isHostAssigned: false,
          assignedStaffName: '',
          assignedStaffUid: ''
        };
      }
      return cp;
    });

    try {
      await updateDoc(doc(db, 'races', raceId), {
        checkpoints: updatedCheckpoints.map((cp) => sanitizeFirestorePayload(cp)),
        hostAssignedCheckpointId: null,
        updatedAt: now
      });

      const sessionId = `session_host_${raceId}_${uid}`;
      try {
        await deleteDoc(doc(db, 'races', raceId, 'staffSessions', sessionId));
      } catch (e) {
        // ignore deletion error if session does not exist
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `races/${raceId}`);
    }
  }

  /**
   * Claim Checkpoint by a staff volunteer (ensuring not claimed by Host)
   */
  static async claimCheckpoint(params: {
    raceId: string;
    checkpointId: string;
    staffName: string;
    deviceName?: string;
    staffUid?: string;
  }): Promise<Checkpoint> {
    const now = TimeSyncService.now();
    const race = await this.getRace(params.raceId);
    if (!race) throw new Error('Race not found.');

    const targetCp = race.checkpoints.find((c) => c.id === params.checkpointId);
    if (!targetCp) throw new Error('Checkpoint not found in this race.');

    // Check if locked by Host
    if (targetCp.isHostAssigned && params.staffUid !== race.hostUid) {
      throw new Error(`This checkpoint has been assigned to Host (${targetCp.assignedStaffName || 'Host'}).`);
    }

    // Update checkpoint with assigned staff info
    const updatedCheckpoints = race.checkpoints.map((cp) => {
      if (cp.id === params.checkpointId) {
        return {
          ...cp,
          assignedStaffName: params.staffName.trim(),
          assignedStaffUid: params.staffUid || '',
          assignedDeviceName: params.deviceName || 'Staff Phone'
        };
      }
      return cp;
    });

    try {
      await updateDoc(doc(db, 'races', params.raceId), {
        checkpoints: updatedCheckpoints.map((cp) => sanitizeFirestorePayload(cp)),
        updatedAt: now
      });

      // Create / update staffSession
      const sessionId = `session_${params.staffUid || Math.random().toString(36).substring(2, 8)}`;
      const session: StaffSession = {
        id: sessionId,
        raceId: params.raceId,
        checkpointId: targetCp.id,
        checkpointName: targetCp.name,
        checkpointDistanceMeters: targetCp.distanceMeters,
        staffName: params.staffName.trim(),
        deviceName: params.deviceName || 'Staff Phone',
        joinedAt: now,
        lastSeenAt: now,
        status: 'ONLINE',
        isHost: params.staffUid === race.hostUid
      };
      await setDoc(doc(db, 'races', params.raceId, 'staffSessions', sessionId), sanitizeFirestorePayload(session), { merge: true });

      return {
        ...targetCp,
        assignedStaffName: params.staffName.trim()
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `races/${params.raceId}`);
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
   * Resolve Join Code (e.g. "8K4P-29" or "8K4P29") to Race & Checkpoint
   */
  static async resolveJoinCode(joinCode: string): Promise<JoinCodeMapping | null> {
    const raw = joinCode.trim().toUpperCase();
    if (!raw) return null;

    const withDash = raw.includes('-') ? raw : (raw.length === 6 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw);
    const withoutDash = raw.replace(/[^A-Z0-9]/g, '');

    try {
      // 1. Try exact cleaned code
      let snap = await getDoc(doc(db, 'joinCodes', raw));
      if (snap.exists()) return snap.data() as JoinCodeMapping;

      // 2. Try with formatted dash
      if (withDash !== raw) {
        snap = await getDoc(doc(db, 'joinCodes', withDash));
        if (snap.exists()) return snap.data() as JoinCodeMapping;
      }

      // 3. Try without dash
      if (withoutDash && withoutDash !== raw) {
        snap = await getDoc(doc(db, 'joinCodes', withoutDash));
        if (snap.exists()) return snap.data() as JoinCodeMapping;
      }

      // 4. Fallback search across active joinCodes collection
      const candidates = Array.from(new Set([raw, withDash, withoutDash].filter(Boolean)));
      for (const candidate of candidates) {
        const q = query(collection(db, 'joinCodes'), where('joinCode', '==', candidate), limit(1));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          return qSnap.docs[0].data() as JoinCodeMapping;
        }
      }

      return null;
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
      const isStart = idx === 0 && (cp.distanceMeters === 0 || normalizeCheckpointType(cp.type) === 'start' || cp.isStart);
      const isFinal = idx === sorted.length - 1;
      let enforcedType: CheckpointType;
      if (isStart) {
        enforcedType = 'start';
      } else if (isFinal) {
        enforcedType = 'finish';
      } else {
        const norm = normalizeCheckpointType(cp.type);
        enforcedType = norm === 'splitOnly' ? 'splitOnly' : 'splitFinish';
      }
      return sanitizeFirestorePayload({
        ...cp,
        order: idx + 1,
        isStart: !!isStart,
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
   * Delete Race and all its subcollections, join codes, and published results permanently
   */
  static async deleteRace(raceId: string, joinCodes: string[] = []): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be signed in as host to delete a race.');
    }

    try {
      // 1. Check race document to verify ownership and extract any checkpoint joinCodes
      const raceSnap = await getDoc(doc(db, 'races', raceId)).catch(() => null);
      const collectedJoinCodes = new Set<string>(joinCodes.map((c) => c.toUpperCase()));

      if (raceSnap && raceSnap.exists()) {
        const raceData = raceSnap.data() as Race;
        if (raceData.hostUid && raceData.hostUid !== user.uid && user.email !== 'jatdgr@gmail.com') {
          throw new Error('Unauthorized: Only the race creator or administrator can delete this race.');
        }
        if (raceData.checkpoints && Array.isArray(raceData.checkpoints)) {
          raceData.checkpoints.forEach((cp) => {
            if (cp.joinCode) collectedJoinCodes.add(cp.joinCode.toUpperCase());
          });
        }
      }

      // 2. Cascade Delete: Published Result record from /publishedResults (both direct doc and any matching query)
      const pubDeletions: Promise<any>[] = [];
      pubDeletions.push(deleteDoc(doc(db, 'publishedResults', raceId)).catch(() => {}));
      try {
        const pubQuery = query(collection(db, 'publishedResults'), where('raceId', '==', raceId));
        const pubSnap = await getDocs(pubQuery);
        pubSnap.forEach((d) => pubDeletions.push(deleteDoc(d.ref).catch(() => {})));
      } catch (err) {
        console.warn('Cascade delete publishedResults query warning:', err);
      }
      await Promise.all(pubDeletions);

      // 3. Cascade Delete: Timing Events subcollection (/races/{raceId}/events)
      try {
        const eventsSnap = await getDocs(collection(db, 'races', raceId, 'events'));
        const eventDeletions = eventsSnap.docs.map((d) => deleteDoc(d.ref).catch((e) => {
          console.warn('Event delete warning:', e);
        }));
        await Promise.all(eventDeletions);
      } catch (err) {
        console.warn('Cascade delete events subcollection warning:', err);
      }

      // 4. Cascade Delete: Staff Sessions subcollection (/races/{raceId}/staffSessions)
      try {
        const sessionsSnap = await getDocs(collection(db, 'races', raceId, 'staffSessions'));
        const sessionDeletions = sessionsSnap.docs.map((d) => deleteDoc(d.ref).catch((e) => {
          console.warn('Session delete warning:', e);
        }));
        await Promise.all(sessionDeletions);
      } catch (err) {
        console.warn('Cascade delete staffSessions subcollection warning:', err);
      }

      // 5. Cascade Delete: Potential subcollections defensively
      const candidateSubcollections = ['checkpoints', 'splits', 'results', 'timings', 'activity'];
      for (const subcol of candidateSubcollections) {
        try {
          const snap = await getDocs(collection(db, 'races', raceId, subcol));
          if (!snap.empty) {
            await Promise.all(snap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
          }
        } catch {
          // ignore
        }
      }

      // 6. Cascade Delete: Join Codes lookup mappings
      const codeDeletions: Promise<any>[] = [];
      collectedJoinCodes.forEach((rawCode) => {
        if (!rawCode) return;
        codeDeletions.push(deleteDoc(doc(db, 'joinCodes', rawCode)).catch(() => {}));
        const noDash = rawCode.replace(/-/g, '');
        if (noDash !== rawCode) {
          codeDeletions.push(deleteDoc(doc(db, 'joinCodes', noDash)).catch(() => {}));
        }
      });
      try {
        const joinQuery = query(collection(db, 'joinCodes'), where('raceId', '==', raceId));
        const joinSnap = await getDocs(joinQuery);
        joinSnap.forEach((d) => codeDeletions.push(deleteDoc(d.ref).catch(() => {})));
      } catch (err) {
        console.warn('Cascade delete joinCodes query warning:', err);
      }
      await Promise.all(codeDeletions);

      // 7. Finally Delete Root Race Document
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
      runnerGender: race.runnerGender || 'MALE',
      runnerAge: race.runnerAge !== undefined && !isNaN(Number(race.runnerAge)) ? Number(race.runnerAge) : undefined,
      runnerCity: race.runnerCity?.trim() || '',
      runnerState: race.runnerState?.trim() || '',
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
   * Update race runner metadata (e.g. gender, age, city, state)
   */
  static async updateRaceRunnerProfile(
    raceId: string, 
    data: {
      runnerName?: string;
      runnerGender?: 'MALE' | 'FEMALE';
      runnerAge?: number;
      runnerCity?: string;
      runnerState?: string;
    }
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be signed in to edit race.');

    const now = TimeSyncService.now();
    const updatePayload: Record<string, any> = {
      updatedAt: now,
      ...data
    };

    try {
      await updateDoc(doc(db, 'races', raceId), sanitizeFirestorePayload(updatePayload));

      // Also update published result if it exists so leaderboard stays in sync immediately
      const pubSnap = await getDoc(doc(db, 'publishedResults', raceId)).catch(() => null);
      if (pubSnap && pubSnap.exists()) {
        await updateDoc(doc(db, 'publishedResults', raceId), sanitizeFirestorePayload({
          updatedAt: now,
          ...data
        }));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `races/${raceId}`);
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
   * Permanently delete a published race result document from Firestore
   */
  static async deleteRaceResult(raceId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be signed in to delete result.');

    try {
      const deletions: Promise<any>[] = [];
      deletions.push(deleteDoc(doc(db, 'publishedResults', raceId)));

      try {
        const pubQuery = query(collection(db, 'publishedResults'), where('raceId', '==', raceId));
        const pubSnap = await getDocs(pubQuery);
        pubSnap.forEach((d) => deletions.push(deleteDoc(d.ref)));
      } catch (err) {
        console.warn('Querying publishedResults deletion warning:', err);
      }

      await Promise.all(deletions);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `publishedResults/${raceId}`);
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
