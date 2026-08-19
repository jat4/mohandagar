import React, { useState, useEffect } from 'react';
import { 
  Race, 
  Checkpoint, 
  TimingEvent, 
  StaffSession, 
  DistanceUnit, 
  CheckpointType 
} from '../../types/race';
import { RaceService } from '../../services/raceService';
import { formatDistance } from '../../utils/raceCalculations';
import { RaceLiveDashboard } from './RaceLiveDashboard';
import { RaceActivitySummary } from './RaceActivitySummary';
import { CheckpointStaffScreen } from './CheckpointStaffScreen';
import { 
  Plus, 
  Trash2, 
  Play, 
  Sparkles, 
  Flag, 
  Layers, 
  QrCode, 
  User, 
  Hash, 
  Settings, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  RotateCcw,
  LogOut,
  Clock,
  Timer,
  Zap,
  Activity,
  ListOrdered
} from 'lucide-react';
import { auth, signInWithGoogle, signOutUser } from '../../lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

interface HostDashboardProps {
  onJoinByCodeClicked: () => void;
  routeRaceId?: string;
  routeView?: 'home' | 'live' | 'summary';
  onNavigateRoute?: (view: 'home' | 'live' | 'summary', raceId?: string) => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({
  onJoinByCodeClicked,
  routeRaceId,
  routeView = 'home',
  onNavigateRoute
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active Race state
  const [activeRace, setActiveRace] = useState<Race | null>(null);
  const [events, setEvents] = useState<TimingEvent[]>([]);
  const [staffSessions, setStaffSessions] = useState<StaffSession[]>([]);
  const [viewMode, setViewMode] = useState<'CONTROLLER' | 'SUMMARY' | 'TIMING_AS_HOST'>(
    routeView === 'summary' ? 'SUMMARY' : 'CONTROLLER'
  );
  const [hostAssignedCheckpoint, setHostAssignedCheckpoint] = useState<Checkpoint | null>(null);

  // Load race from route if provided
  useEffect(() => {
    if (routeRaceId && activeRace?.id !== routeRaceId) {
      RaceService.getRace(routeRaceId).then((r) => {
        if (r) {
          setActiveRace(r);
          setViewMode(routeView === 'summary' ? 'SUMMARY' : 'CONTROLLER');
        }
      }).catch(console.error);
    } else if (!routeRaceId && !activeRace) {
      setViewMode('CONTROLLER');
    }
  }, [routeRaceId, routeView]);

  useEffect(() => {
    if (routeView === 'summary') {
      setViewMode('SUMMARY');
    } else if (routeView === 'live' && activeRace) {
      setViewMode('CONTROLLER');
    }
  }, [routeView, activeRace?.id]);

  // Create Race Form state
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [raceName, setRaceName] = useState('5K Time Trial Championship');
  const [runnerName, setRunnerName] = useState('Rahul Verma');
  const [runnerBib, setRunnerBib] = useState('101');
  const [totalPlannedDist, setTotalPlannedDist] = useState<number>(5000); // 5000m
  const [displayUnit, setDisplayUnit] = useState<DistanceUnit>('KILOMETERS');

  // Checkpoints list for new race
  const [wizardCheckpoints, setWizardCheckpoints] = useState<Array<{
    id: string;
    name: string;
    distanceMeters: number;
    type: CheckpointType;
    assignedStaffName: string;
  }>>([
    { id: '1', name: 'CP 1 (Turn 1)', distanceMeters: 1000, type: 'SPLIT', assignedStaffName: 'Rahul (Phone A)' },
    { id: '2', name: 'CP 2 (Midpoint)', distanceMeters: 2000, type: 'SPLIT', assignedStaffName: 'Amit (Phone B)' },
    { id: '3', name: 'CP 3 (Turn 3)', distanceMeters: 3000, type: 'SPLIT', assignedStaffName: 'Suresh (Phone C)' },
    { id: '4', name: 'CP 4 (Final Loop)', distanceMeters: 4000, type: 'SPLIT', assignedStaffName: 'Pooja (Phone D)' },
    { id: '5', name: 'FINISH GATE', distanceMeters: 5000, type: 'SPLIT_AND_FINISH', assignedStaffName: 'Host (Finish Line)' }
  ]);

  const [creatingRace, setCreatingRace] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Subscribe to active race changes
  useEffect(() => {
    if (!activeRace?.id) return;

    const unsubRace = RaceService.subscribeToRace(
      activeRace.id,
      (updated) => {
        if (updated) {
          setActiveRace(updated);
        }
      },
      (err) => console.error(err)
    );

    const unsubEvents = RaceService.subscribeToTimingEvents(
      activeRace.id,
      (evts) => setEvents(evts)
    );

    const unsubSessions = RaceService.subscribeToStaffSessions(
      activeRace.id,
      (sessions) => setStaffSessions(sessions)
    );

    return () => {
      unsubRace();
      unsubEvents();
      unsubSessions();
    };
  }, [activeRace?.id]);

  // Load Preset Templates
  const handleLoadTemplate = (type: '5k_500m' | '1600m_400m' | '10k_1km') => {
    if (type === '1600m_400m') {
      setRaceName('1600m Track Time Trial');
      setTotalPlannedDist(1600);
      setDisplayUnit('METERS');
      setWizardCheckpoints([
        { id: '1', name: 'Lap 1 (400m)', distanceMeters: 400, type: 'SPLIT', assignedStaffName: 'Phone A' },
        { id: '2', name: 'Lap 2 (800m)', distanceMeters: 800, type: 'SPLIT', assignedStaffName: 'Phone B' },
        { id: '3', name: 'Lap 3 (1200m)', distanceMeters: 1200, type: 'SPLIT', assignedStaffName: 'Phone C' },
        { id: '4', name: 'Lap 4 / FINISH (1600m)', distanceMeters: 1600, type: 'SPLIT_AND_FINISH', assignedStaffName: 'Host' }
      ]);
    } else if (type === '10k_1km') {
      setRaceName('10K Road Time Trial');
      setTotalPlannedDist(10000);
      setDisplayUnit('KILOMETERS');
      setWizardCheckpoints(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((km) => ({
          id: String(km),
          name: km === 10 ? '10K FINISH' : `KM ${km}`,
          distanceMeters: km * 1000,
          type: km === 10 ? 'SPLIT_AND_FINISH' : 'SPLIT',
          assignedStaffName: ''
        }))
      );
    } else {
      setRaceName('5K Custom Time Trial');
      setTotalPlannedDist(5000);
      setDisplayUnit('KILOMETERS');
      setWizardCheckpoints([
        { id: '1', name: '500m Mark', distanceMeters: 500, type: 'SPLIT', assignedStaffName: '' },
        { id: '2', name: '1.0 km Split', distanceMeters: 1000, type: 'SPLIT', assignedStaffName: '' },
        { id: '3', name: '1.5 km Split', distanceMeters: 1500, type: 'SPLIT', assignedStaffName: '' },
        { id: '4', name: '2.5 km Midpoint', distanceMeters: 2500, type: 'SPLIT', assignedStaffName: '' },
        { id: '5', name: '3.75 km Loop', distanceMeters: 3750, type: 'SPLIT', assignedStaffName: '' },
        { id: '6', name: '5.0 km FINISH', distanceMeters: 5000, type: 'SPLIT_AND_FINISH', assignedStaffName: '' }
      ]);
    }
  };

  const handleAddCheckpoint = () => {
    const lastDist = wizardCheckpoints.length > 0 
      ? wizardCheckpoints[wizardCheckpoints.length - 1].distanceMeters + 1000
      : 1000;

    const newCp = {
      id: String(Date.now()),
      name: `Checkpoint ${wizardCheckpoints.length + 1}`,
      distanceMeters: lastDist,
      type: 'SPLIT' as CheckpointType,
      assignedStaffName: ''
    };
    setWizardCheckpoints([...wizardCheckpoints, newCp]);
  };

  const handleRemoveCheckpoint = (index: number) => {
    if (wizardCheckpoints.length <= 1) {
      alert('A race requires at least one checkpoint or finish point.');
      return;
    }
    const updated = [...wizardCheckpoints];
    updated.splice(index, 1);
    setWizardCheckpoints(updated);
  };

  const handleMoveCheckpoint = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === wizardCheckpoints.length - 1) return;

    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    const updated = [...wizardCheckpoints];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setWizardCheckpoints(updated);
  };

  const handleCreateRace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please sign in to create and manage a race.');
      return;
    }

    if (wizardCheckpoints.length === 0) {
      alert('Please add at least one checkpoint.');
      return;
    }

    setCreatingRace(true);
    setErrorMessage(null);

    try {
      const created = await RaceService.createRace({
        name: raceName,
        runnerName,
        runnerBib,
        totalPlannedDistanceMeters: totalPlannedDist,
        displayUnit,
        checkpoints: wizardCheckpoints.map((c) => ({
          name: c.name,
          distanceMeters: Number(c.distanceMeters),
          type: c.type,
          assignedStaffName: c.assignedStaffName
        }))
      });

      setActiveRace(created);
      setShowCreateWizard(false);
      setViewMode('CONTROLLER');
      if (onNavigateRoute) {
        onNavigateRoute('live', created.id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to create race.');
    } finally {
      setCreatingRace(false);
    }
  };

  const handleAssignSelfToCheckpoint = (checkpoint: Checkpoint) => {
    setHostAssignedCheckpoint(checkpoint);
    setViewMode('TIMING_AS_HOST');
  };

  const handleResetRace = async () => {
    if (!activeRace) return;
    await RaceService.resetRace(activeRace.id);
  };

  // If Host is timing a specific checkpoint
  if (viewMode === 'TIMING_AS_HOST' && activeRace && hostAssignedCheckpoint) {
    return (
      <CheckpointStaffScreen
        race={activeRace}
        checkpoint={hostAssignedCheckpoint}
        events={events}
        staffName={currentUser?.displayName || 'Race Host'}
        deviceName="Host Primary Device"
        isHost={true}
        onExit={() => setViewMode('CONTROLLER')}
      />
    );
  }

  // If viewing post-race activity summary
  if (viewMode === 'SUMMARY' && activeRace) {
    return (
      <div className="pt-8 max-w-7xl mx-auto px-4">
        <RaceActivitySummary
          race={activeRace}
          events={events}
          onBackToDashboard={() => {
            setViewMode('CONTROLLER');
            if (onNavigateRoute) onNavigateRoute('live', activeRace.id);
          }}
          onResetRace={handleResetRace}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Host Header & Authentication Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100">
              Host Race Controller
            </h1>
            <p className="text-xs font-mono text-slate-400">
              Multi-device synchronized runner timing engine
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-300">
                Host: <strong className="text-cyan-300">{currentUser.displayName || currentUser.email}</strong>
              </span>
              <button
                onClick={() => signOutUser()}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-mono transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Host Sign In (Google)</span>
            </button>
          )}

          <button
            onClick={onJoinByCodeClicked}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Join with Code / QR</span>
          </button>

          {!activeRace && (
            <button
              onClick={() => setShowCreateWizard(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Race</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Race Controller View */}
      {activeRace ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
            <span>
              Managing: <strong className="text-slate-200">{activeRace.name}</strong> • Checkpoints: <strong className="text-cyan-300">{activeRace.checkpoints.length}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setViewMode('SUMMARY');
                  if (onNavigateRoute && activeRace) onNavigateRoute('summary', activeRace.id);
                }}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer"
              >
                View Activity Summary
              </button>

              <button
                onClick={() => {
                  if (confirm('Close current race from host controller? (Race state remains saved in Firestore)')) {
                    setActiveRace(null);
                    if (onNavigateRoute) onNavigateRoute('home');
                  }
                }}
                className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-mono transition-colors cursor-pointer"
              >
                Close Race
              </button>
            </div>
          </div>

          <RaceLiveDashboard
            race={activeRace}
            events={events}
            staffSessions={staffSessions}
            onOpenSummary={() => {
              setViewMode('SUMMARY');
              if (onNavigateRoute && activeRace) onNavigateRoute('summary', activeRace.id);
            }}
            onAssignSelfToCheckpoint={handleAssignSelfToCheckpoint}
            onResetRace={handleResetRace}
          />
        </div>
      ) : showCreateWizard ? (
        /* Create Race Wizard Form */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fadeIn">
          
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Configure Race & Checkpoints</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Set race distance and add unlimited custom checkpoints at any increasing distance
              </p>
            </div>

            <button
              onClick={() => setShowCreateWizard(false)}
              className="text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Quick Preset Templates */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              Quick Course Templates
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleLoadTemplate('5k_500m')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
              >
                5K Custom (500m, 1km, 1.5km, 2.5km, 3.75km, 5km)
              </button>
              <button
                type="button"
                onClick={() => handleLoadTemplate('1600m_400m')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
              >
                1600m Track (400m, 800m, 1200m, 1600m)
              </button>
              <button
                type="button"
                onClick={() => handleLoadTemplate('10k_1km')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
              >
                10K Standard (1km Splits)
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-mono">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCreateRace} className="space-y-6">
            
            {/* Race General Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Race / Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={raceName}
                  onChange={(e) => setRaceName(e.target.value)}
                  placeholder="e.g. 5K Time Trial"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Runner Name *
                </label>
                <input
                  type="text"
                  required
                  value={runnerName}
                  onChange={(e) => setRunnerName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Bib Number
                </label>
                <input
                  type="text"
                  value={runnerBib}
                  onChange={(e) => setRunnerBib(e.target.value)}
                  placeholder="e.g. 101"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Total Planned Distance (Meters) *
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  step={10}
                  value={totalPlannedDist}
                  onChange={(e) => setTotalPlannedDist(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  Display Distance Unit
                </label>
                <select
                  value={displayUnit}
                  onChange={(e) => setDisplayUnit(e.target.value as DistanceUnit)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="KILOMETERS">Kilometers (km)</option>
                  <option value="METERS">Meters (m)</option>
                  <option value="MILES">Miles (mi)</option>
                </select>
              </div>
            </div>

            {/* Unlimited Checkpoints Builder */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-cyan-400" />
                    <span>Checkpoints List ({wizardCheckpoints.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Must be in ascending distance order. Use meters internally.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddCheckpoint}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Checkpoint</span>
                </button>
              </div>

              <div className="space-y-3">
                {wizardCheckpoints.map((cp, idx) => (
                  <div
                    key={cp.id || idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-400 flex items-center justify-center text-xs font-mono font-bold">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        required
                        value={cp.name}
                        onChange={(e) => {
                          const updated = [...wizardCheckpoints];
                          updated[idx].name = e.target.value;
                          setWizardCheckpoints(updated);
                        }}
                        placeholder="Checkpoint Name"
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500 w-40 sm:w-48"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-slate-500">Meters:</span>
                        <input
                          type="number"
                          required
                          min={1}
                          step={1}
                          value={cp.distanceMeters}
                          onChange={(e) => {
                            const updated = [...wizardCheckpoints];
                            updated[idx].distanceMeters = Number(e.target.value);
                            setWizardCheckpoints(updated);
                          }}
                          className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-slate-500">Type:</span>
                        <select
                          value={cp.type}
                          onChange={(e) => {
                            const updated = [...wizardCheckpoints];
                            updated[idx].type = e.target.value as CheckpointType;
                            setWizardCheckpoints(updated);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
                        >
                          <option value="SPLIT">SPLIT</option>
                          <option value="SPLIT_AND_FINISH">SPLIT + FINISH</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-slate-500">Staff:</span>
                        <input
                          type="text"
                          value={cp.assignedStaffName}
                          onChange={(e) => {
                            const updated = [...wizardCheckpoints];
                            updated[idx].assignedStaffName = e.target.value;
                            setWizardCheckpoints(updated);
                          }}
                          placeholder="Staff Name"
                          className="w-28 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveCheckpoint(idx, 'UP')}
                          disabled={idx === 0}
                          className="p-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCheckpoint(idx, 'DOWN')}
                          disabled={idx === wizardCheckpoints.length - 1}
                          className="p-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCheckpoint(idx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="Delete Checkpoint"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateWizard(false)}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creatingRace}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {creatingRace ? 'Creating Race & Join Codes...' : 'Launch Race Controller'}
              </button>
            </div>

          </form>
        </div>
      ) : (
        /* Empty State / Welcome Screen */
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-10 sm:p-14 text-center max-w-3xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <Timer className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mb-2">
            Multi-Checkpoint Race Timing
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-mono max-w-lg mx-auto mb-8">
            Create an authoritative time trial, assign checkpoint phones with unique Join Codes & QR cards, and track live segment paces with automatic missed-checkpoint recovery.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setShowCreateWizard(true)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm flex items-center gap-2 shadow-xl shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Race</span>
            </button>

            <button
              onClick={onJoinByCodeClicked}
              className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>Join as Checkpoint Staff</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
