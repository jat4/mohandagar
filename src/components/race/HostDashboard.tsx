/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Race, 
  Checkpoint, 
  CheckpointType, 
  TimingEvent, 
  StaffSession, 
  DistanceUnit,
  normalizeCheckpointType
} from '../../types/race';
import { RaceService } from '../../services/raceService';
import { signInWithGoogle, signOutUser, auth } from '../../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { RaceLiveDashboard } from './RaceLiveDashboard';
import { CheckpointStaffScreen } from './CheckpointStaffScreen';
import { RaceActivitySummary } from './RaceActivitySummary';
import { RaceHistoryView } from './RaceHistoryView';
import { ConfirmModal } from '../common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { 
  Plus, 
  Sparkles, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  User, 
  QrCode, 
  Zap, 
  CheckCircle2, 
  Timer, 
  LogOut,
  History,
  Activity,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';

interface HostDashboardProps {
  onJoinByCodeClicked: () => void;
  routeRaceId?: string;
  routeView?: 'home' | 'live' | 'summary';
  onNavigateRoute?: (view: 'home' | 'live' | 'summary', raceId?: string) => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({
  onJoinByCodeClicked,
  routeRaceId,
  routeView,
  onNavigateRoute
}) => {
  const { showToast } = useToast();

  // Primary active tab
  const [activeTab, setActiveTab] = useState<'CONTROLLER' | 'HISTORY'>('CONTROLLER');

  // Authenticated Host
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active Race state
  const [activeRace, setActiveRace] = useState<Race | null>(null);
  const [events, setEvents] = useState<TimingEvent[]>([]);
  const [staffSessions, setStaffSessions] = useState<StaffSession[]>([]);

  // Historical races list
  const [hostRaces, setHostRaces] = useState<Race[]>([]);

  // View mode within Controller
  const [viewMode, setViewMode] = useState<'CONTROLLER' | 'TIMING_AS_HOST' | 'SUMMARY'>('CONTROLLER');
  const [hostAssignedCheckpoint, setHostAssignedCheckpoint] = useState<Checkpoint | null>(null);

  // Modal confirmation states
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Synchronize route
  useEffect(() => {
    if (routeRaceId && (!activeRace || activeRace.id !== routeRaceId)) {
      RaceService.getRace(routeRaceId).then((r) => {
        if (r) setActiveRace(r);
      }).catch(console.error);
    }
  }, [routeRaceId]);

  useEffect(() => {
    if (routeView === 'summary') {
      setViewMode('SUMMARY');
    } else if (routeView === 'live' && activeRace) {
      setViewMode('CONTROLLER');
    }
  }, [routeView, activeRace?.id]);

  // Create Race Form state
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [raceName, setRaceName] = useState('5K Time Trial');
  const [runnerName, setRunnerName] = useState('Runner Name');
  const [totalPlannedDist, setTotalPlannedDist] = useState<number>(5000); // 5000m
  const [displayUnit, setDisplayUnit] = useState<DistanceUnit>('KILOMETERS');

  // Checkpoints list for new race (Matches example structure: 4 normal checkpoints + 1 locked finish line)
  const [wizardCheckpoints, setWizardCheckpoints] = useState<Array<{
    id: string;
    name: string;
    distanceMeters: number;
    type: CheckpointType;
    assignedStaffName: string;
  }>>([
    { id: '1', name: 'CP 1 (1000m)', distanceMeters: 1000, type: 'splitFinish', assignedStaffName: 'Phone A' },
    { id: '2', name: 'CP 2 (2000m)', distanceMeters: 2000, type: 'splitOnly', assignedStaffName: 'Phone B' },
    { id: '3', name: 'CP 3 (3000m)', distanceMeters: 3000, type: 'splitFinish', assignedStaffName: 'Phone C' },
    { id: '4', name: 'CP 4 (4000m)', distanceMeters: 4000, type: 'splitOnly', assignedStaffName: 'Phone D' },
    { id: '5', name: 'FINISH LINE', distanceMeters: 5000, type: 'finish', assignedStaffName: 'Finish Line' }
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

  // Subscribe to host races history
  useEffect(() => {
    const unsub = RaceService.subscribeToHostRaces(
      currentUser?.uid,
      (races) => {
        setHostRaces(races);
      },
      (err) => console.warn('History subscription note:', err)
    );
    return () => unsub();
  }, [currentUser?.uid]);

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
        { id: '1', name: 'Lap 1 (400m)', distanceMeters: 400, type: 'splitFinish', assignedStaffName: 'Phone A' },
        { id: '2', name: 'Lap 2 (800m)', distanceMeters: 800, type: 'splitOnly', assignedStaffName: 'Phone B' },
        { id: '3', name: 'Lap 3 (1200m)', distanceMeters: 1200, type: 'splitFinish', assignedStaffName: 'Phone C' },
        { id: '4', name: 'FINISH LINE (1600m)', distanceMeters: 1600, type: 'finish', assignedStaffName: 'Finish Line' }
      ]);
      showToast({ type: 'info', title: '1600m Template Loaded', message: 'Configured 4 track laps with locked finish line.' });
    } else if (type === '10k_1km') {
      setRaceName('10K Road Time Trial');
      setTotalPlannedDist(10000);
      setDisplayUnit('KILOMETERS');
      setWizardCheckpoints(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((km) => ({
          id: String(km),
          name: km === 10 ? '10K FINISH' : `KM ${km}`,
          distanceMeters: km * 1000,
          type: (km === 10 ? 'finish' : (km % 2 === 1 ? 'splitFinish' : 'splitOnly')) as CheckpointType,
          assignedStaffName: ''
        }))
      );
      showToast({ type: 'info', title: '10K Template Loaded', message: 'Configured 10 kilometer checkpoints.' });
    } else {
      setRaceName('5K Custom Time Trial');
      setTotalPlannedDist(5000);
      setDisplayUnit('KILOMETERS');
      setWizardCheckpoints([
        { id: '1', name: 'CP 1 (1000m)', distanceMeters: 1000, type: 'splitFinish', assignedStaffName: '' },
        { id: '2', name: 'CP 2 (2000m)', distanceMeters: 2000, type: 'splitOnly', assignedStaffName: '' },
        { id: '3', name: 'CP 3 (3000m)', distanceMeters: 3000, type: 'splitFinish', assignedStaffName: '' },
        { id: '4', name: 'CP 4 (4000m)', distanceMeters: 4000, type: 'splitOnly', assignedStaffName: '' },
        { id: '5', name: 'FINISH LINE', distanceMeters: 5000, type: 'finish', assignedStaffName: 'Finish Line' }
      ]);
      showToast({ type: 'info', title: '5K Template Loaded', message: 'Configured 5 checkpoints matching official structure.' });
    }
  };

  const handleAddCheckpoint = () => {
    const count = wizardCheckpoints.length;
    if (count === 0) {
      setWizardCheckpoints([
        { id: String(Date.now()), name: 'FINISH LINE', distanceMeters: 5000, type: 'finish', assignedStaffName: '' }
      ]);
      return;
    }

    const lastCp = wizardCheckpoints[count - 1];
    const prevDist = count > 1 ? wizardCheckpoints[count - 2].distanceMeters : 0;
    const newDist = Math.max(prevDist + 500, Math.round((prevDist + lastCp.distanceMeters) / 2)) || (lastCp.distanceMeters > 500 ? lastCp.distanceMeters - 500 : lastCp.distanceMeters);

    const newCp = {
      id: String(Date.now()),
      name: `CP ${count}`,
      distanceMeters: newDist,
      type: 'splitFinish' as CheckpointType,
      assignedStaffName: ''
    };

    const updated = [
      ...wizardCheckpoints.slice(0, count - 1),
      newCp,
      { ...lastCp, type: 'finish' as CheckpointType }
    ];
    setWizardCheckpoints(updated);
  };

  const handleRemoveCheckpoint = (index: number) => {
    if (wizardCheckpoints.length <= 1) {
      showToast({ type: 'warning', title: 'Cannot Delete', message: 'A race requires at least one checkpoint or finish gate.' });
      return;
    }
    const updated = [...wizardCheckpoints];
    updated.splice(index, 1);
    // Ensure final checkpoint is always 'finish'
    const lastIdx = updated.length - 1;
    updated[lastIdx] = { ...updated[lastIdx], type: 'finish' as CheckpointType };
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
    // Ensure final checkpoint is always 'finish'
    const lastIdx = updated.length - 1;
    updated[lastIdx] = { ...updated[lastIdx], type: 'finish' as CheckpointType };
    setWizardCheckpoints(updated);
  };

  const handleCreateRace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast({ type: 'error', title: 'Sign In Required', message: 'Please sign in with Google to create and host races.' });
      return;
    }

    if (wizardCheckpoints.length === 0) {
      showToast({ type: 'warning', title: 'Checkpoints Required', message: 'Please add at least one checkpoint or finish line.' });
      return;
    }

    setCreatingRace(true);
    setErrorMessage(null);

    try {
      const created = await RaceService.createRace({
        name: raceName,
        runnerName,
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
      setActiveTab('CONTROLLER');
      showToast({ type: 'success', title: 'Race Created!', message: `"${created.name}" is ready with ${created.checkpoints.length} checkpoint join codes.` });

      if (onNavigateRoute) {
        onNavigateRoute('live', created.id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to create race.');
      showToast({ type: 'error', title: 'Creation Failed', message: err.message || 'Failed to create race in cloud database.' });
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
    try {
      await RaceService.resetRace(activeRace.id);
      showToast({ type: 'success', title: 'Race Reset', message: 'Race clock has been reset to READY and splits cleared.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Reset Failed', message: err.message || 'Could not reset race.' });
    }
  };

  const handleDeleteRacePermanently = async (raceId: string, joinCodes: string[]) => {
    try {
      await RaceService.deleteRace(raceId, joinCodes);
      showToast({ type: 'success', title: 'Race Permanently Deleted', message: 'All race timings, splits, and join codes were erased.' });
      if (activeRace?.id === raceId) {
        setActiveRace(null);
        if (onNavigateRoute) onNavigateRoute('home');
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message || 'Failed to delete race from database.' });
    }
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
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      
      {/* Top Header & Authentication Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
            <Zap className="w-5 h-5 sm:w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-100">
              Host Race Controller
            </h1>
            <p className="text-[11px] sm:text-xs font-mono text-slate-400">
              Multi-device synchronized runner timing & race history
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-mono text-slate-200">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
              <button
                onClick={() => {
                  signOutUser();
                  showToast({ type: 'info', title: 'Signed Out', message: 'You have signed out of Host mode.' });
                }}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Host Sign In (Google)</span>
            </button>
          )}

          <button
            onClick={onJoinByCodeClicked}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Join with Code / QR</span>
          </button>

          {!activeRace && (
            <button
              onClick={() => {
                setShowCreateWizard(true);
                setActiveTab('CONTROLLER');
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Race</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Section Tabs: Live Controller vs Race History */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('CONTROLLER')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'CONTROLLER'
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Controller {activeRace ? `(${activeRace.name})` : ''}</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'HISTORY'
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Race History ({hostRaces.length})</span>
        </button>
      </div>

      {/* TAB 1: Race History View */}
      {activeTab === 'HISTORY' && (
        <RaceHistoryView
          races={hostRaces}
          currentUserId={currentUser?.uid}
          onSelectRace={(race) => {
            setActiveRace(race);
            setActiveTab('CONTROLLER');
            setViewMode('CONTROLLER');
            if (onNavigateRoute) onNavigateRoute('live', race.id);
          }}
          onViewResults={(race) => {
            setActiveRace(race);
            setActiveTab('CONTROLLER');
            setViewMode('SUMMARY');
            if (onNavigateRoute) onNavigateRoute('summary', race.id);
          }}
          onDeleteRace={handleDeleteRacePermanently}
          onBackToDashboard={() => setActiveTab('CONTROLLER')}
        />
      )}

      {/* TAB 2: Controller & Active Race View */}
      {activeTab === 'CONTROLLER' && (
        <>
          {activeRace ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Active Session: <strong className="text-slate-200">{activeRace.name}</strong> • Runner: <strong className="text-cyan-300">{activeRace.runnerName}</strong></span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setViewMode('SUMMARY');
                      if (onNavigateRoute && activeRace) onNavigateRoute('summary', activeRace.id);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 text-xs font-mono transition-colors cursor-pointer"
                  >
                    View Results & Analytics
                  </button>

                  <button
                    onClick={() => setShowCloseConfirm(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors cursor-pointer border border-slate-800"
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

              {/* Close Race Confirmation Modal */}
              <ConfirmModal
                isOpen={showCloseConfirm}
                title="Close Active Race View?"
                message="This will close the live controller screen. The race and all recorded timings will remain safely stored in your Race History for future review."
                confirmText="Close Screen"
                cancelText="Keep Open"
                variant="info"
                onConfirm={() => {
                  setShowCloseConfirm(false);
                  setActiveRace(null);
                  if (onNavigateRoute) onNavigateRoute('home');
                }}
                onCancel={() => setShowCloseConfirm(false)}
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
                  className="text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Templates */}
              <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Quick Course Templates
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadTemplate('5k_500m')}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
                  >
                    5K Time Trial (6 Checkpoints)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadTemplate('1600m_400m')}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
                  >
                    1600m Track (400m Laps)
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                    >
                      <option value="KILOMETERS">Kilometers (km)</option>
                      <option value="METERS">Meters (m)</option>
                      <option value="MILES">Miles (mi)</option>
                    </select>
                  </div>
                </div>

                {/* Checkpoints Configuration */}
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 font-mono">
                        Checkpoints & Timing Points ({wizardCheckpoints.length})
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500">
                        Order matters: Staff will record splits as the runner passes each checkpoint
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCheckpoint}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Checkpoint</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {wizardCheckpoints.map((cp, idx) => (
                      <div
                        key={cp.id}
                        className="p-3 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3"
                      >
                        {/* Top: Order, Name, and Actions */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="w-6 h-6 shrink-0 rounded-lg bg-slate-800 text-slate-300 font-mono font-bold flex items-center justify-center text-xs">
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
                              placeholder="Checkpoint Name (e.g. 1km Split)"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
                            />
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
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

                        {/* Bottom: Meters, Authority & Assigned Staff */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400 shrink-0 w-16 sm:w-auto">Distance:</span>
                            <div className="relative flex-1">
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
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
                              />
                              <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 font-mono pointer-events-none">m</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400 shrink-0 w-16 sm:w-auto">Type:</span>
                            {idx === wizardCheckpoints.length - 1 ? (
                              <div className="w-full px-2.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold flex items-center justify-between select-none">
                                <span>Finish Line (Finish Only)</span>
                                <span>🔒</span>
                              </div>
                            ) : (
                              <select
                                value={normalizeCheckpointType(cp.type) === 'splitOnly' ? 'splitOnly' : 'splitFinish'}
                                onChange={(e) => {
                                  const updated = [...wizardCheckpoints];
                                  updated[idx].type = e.target.value as CheckpointType;
                                  setWizardCheckpoints(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                              >
                                <option value="splitFinish">Split Gate (Split & Finish)</option>
                                <option value="splitOnly">Split (Split Only)</option>
                              </select>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400 shrink-0 w-16 sm:w-auto">Staff:</span>
                            <input
                              type="text"
                              value={cp.assignedStaffName}
                              onChange={(e) => {
                                const updated = [...wizardCheckpoints];
                                updated[idx].assignedStaffName = e.target.value;
                                setWizardCheckpoints(updated);
                              }}
                              placeholder="Staff Name (Optional)"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
                            />
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
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-10 sm:p-14 text-center max-w-3xl mx-auto shadow-2xl animate-fadeIn">
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

              {hostRaces.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-800/80">
                  <button
                    onClick={() => setActiveTab('HISTORY')}
                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                  >
                    <History className="w-4 h-4" />
                    <span>View {hostRaces.length} Past Race Session(s) in History</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
};
