/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RaceService } from '../services/raceService';
import { Race, CheckpointType, DistanceUnit } from '../types/race';
import { formatDistance } from '../utils/raceCalculations';
import { 
  Plus, 
  Sparkles, 
  Timer, 
  History, 
  Play, 
  Trophy, 
  ArrowRight, 
  Users, 
  Layers, 
  CheckCircle2, 
  X, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Activity,
  Calendar,
  User,
  QrCode
} from 'lucide-react';

export const HostDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [hostRaces, setHostRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Race Wizard State
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [raceName, setRaceName] = useState('5K Time Trial');
  const [runnerName, setRunnerName] = useState('Runner Name');
  const [totalPlannedDist, setTotalPlannedDist] = useState<number>(5000);
  const [displayUnit, setDisplayUnit] = useState<DistanceUnit>('KILOMETERS');

  const [wizardCheckpoints, setWizardCheckpoints] = useState<Array<{
    id: string;
    name: string;
    distanceMeters: number;
    type: CheckpointType;
    assignedStaffName: string;
  }>>([
    { id: '1', name: 'CP 1 (Turn 1)', distanceMeters: 1000, type: 'SPLIT', assignedStaffName: 'Phone A' },
    { id: '2', name: 'CP 2 (Midpoint)', distanceMeters: 2000, type: 'SPLIT', assignedStaffName: 'Phone B' },
    { id: '3', name: 'CP 3 (Turn 3)', distanceMeters: 3000, type: 'SPLIT', assignedStaffName: 'Phone C' },
    { id: '4', name: 'CP 4 (Final Loop)', distanceMeters: 4000, type: 'SPLIT', assignedStaffName: 'Phone D' },
    { id: '5', name: 'FINISH GATE', distanceMeters: 5000, type: 'SPLIT_AND_FINISH', assignedStaffName: 'Finish Line' }
  ]);

  const [creatingRace, setCreatingRace] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Subscribe to host races
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = RaceService.subscribeToHostRaces(
      currentUser.uid,
      (races) => {
        setHostRaces(races);
        setLoading(false);
      },
      (err) => {
        console.warn('Host races query warning:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [currentUser?.uid]);

  const handleAddCheckpoint = () => {
    const lastCp = wizardCheckpoints[wizardCheckpoints.length - 1];
    const newDistance = lastCp ? lastCp.distanceMeters + 1000 : 1000;
    const newId = `${Date.now()}`;
    const newCp = {
      id: newId,
      name: `Checkpoint ${wizardCheckpoints.length + 1}`,
      distanceMeters: newDistance,
      type: 'SPLIT' as CheckpointType,
      assignedStaffName: `Phone ${String.fromCharCode(65 + (wizardCheckpoints.length % 26))}`
    };

    setWizardCheckpoints([...wizardCheckpoints, newCp]);
  };

  const handleRemoveCheckpoint = (id: string) => {
    if (wizardCheckpoints.length <= 1) {
      setErrorMessage('A race must have at least one checkpoint or finish gate.');
      return;
    }
    setWizardCheckpoints(wizardCheckpoints.filter((cp) => cp.id !== id));
  };

  const handleCreateRaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!raceName.trim() || !runnerName.trim()) {
      setErrorMessage('Please provide both race name and runner name.');
      return;
    }
    if (wizardCheckpoints.length === 0) {
      setErrorMessage('Please add at least 1 checkpoint or finish line.');
      return;
    }

    setCreatingRace(true);
    setErrorMessage(null);

    try {
      const newRace = await RaceService.createRace({
        name: raceName.trim(),
        runnerName: runnerName.trim(),
        totalPlannedDistanceMeters: totalPlannedDist,
        displayUnit,
        checkpoints: wizardCheckpoints.map((cp) => ({
          name: cp.name,
          distanceMeters: cp.distanceMeters,
          type: cp.type,
          assignedStaffName: cp.assignedStaffName
        }))
      });

      setShowCreateWizard(false);
      showToast({
        type: 'success',
        title: 'Race Created',
        message: `"${newRace.name}" is ready for live timing.`
      });
      navigate(`/host/race/${newRace.id}`);
    } catch (err: any) {
      console.error('Failed to create race:', err);
      setErrorMessage(err.message || 'Error creating race in cloud database.');
    } finally {
      setCreatingRace(false);
    }
  };

  const activeRunningRaces = hostRaces.filter(r => r.status === 'RUNNING' || r.status === 'READY');
  const finishedRaces = hostRaces.filter(r => r.status === 'FINISHED');

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      
      {/* Top Welcome Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <Timer className="w-4 h-4" />
            <span>Host Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Race Controller Dashboard
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Logged in as <strong className="text-slate-200">{currentUser?.displayName || currentUser?.email}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/host/races"
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>All Races ({hostRaces.length})</span>
          </Link>

          <button
            onClick={() => {
              setShowCreateWizard(true);
              setErrorMessage(null);
            }}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black font-mono text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE NEW RACE</span>
          </button>
        </div>
      </div>

      {/* Active Races Section */}
      {activeRunningRaces.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active & Ready Races ({activeRunningRaces.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRunningRaces.map((race) => (
              <div
                key={race.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      race.status === 'RUNNING'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30 animate-pulse'
                        : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                    }`}>
                      {race.status}
                    </span>
                    <span className="text-xs font-mono text-cyan-300 font-semibold">
                      {formatDistance(race.totalPlannedDistanceMeters, race.displayUnit)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 mb-1 truncate">
                    {race.name}
                  </h3>
                  <div className="text-xs font-mono text-slate-400 space-y-1 mb-4">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Runner: <strong className="text-slate-200">{race.runnerName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>Checkpoints: <strong className="text-slate-200">{race.checkpoints?.length || 0} gates</strong></span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                  <Link
                    to={`/host/race/${race.id}`}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all text-center"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Open Timer</span>
                  </Link>
                  <Link
                    to={`/host/race/${race.id}/checkpoints`}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-mono text-xs flex items-center justify-center gap-1 transition-colors text-center"
                  >
                    <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Gates & QR</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Completed Races */}
      {finishedRaces.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Recently Completed Races</span>
            </h2>
            <Link to="/host/races" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {finishedRaces.slice(0, 3).map((race) => (
              <div
                key={race.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                      FINISHED
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {formatDistance(race.totalPlannedDistanceMeters, race.displayUnit)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mb-1 truncate">
                    {race.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mb-4">
                    Runner: <strong className="text-slate-200">{race.runnerName}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                  <Link
                    to={`/host/race/${race.id}/results`}
                    className="py-2.5 px-3 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>View Results</span>
                  </Link>
                  <Link
                    to={`/activity/${race.id}`}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-xs flex items-center justify-center gap-1 transition-all text-center"
                  >
                    <span>Public Card</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State when no races yet */}
      {!loading && hostRaces.length === 0 && (
        <div className="text-center py-16 px-4 bg-slate-900/50 border border-slate-800/80 rounded-3xl max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
            <Timer className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">No Races Created Yet</h2>
          <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto leading-relaxed">
            Create your first race session, specify distance and checkpoints, and distribute QR codes to volunteer timing staff.
          </p>
          <button
            onClick={() => setShowCreateWizard(true)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black font-mono text-sm inline-flex items-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>CREATE YOUR FIRST RACE</span>
          </button>
        </div>
      )}

      {/* Create Race Modal Wizard */}
      {showCreateWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowCreateWizard(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1 text-emerald-400">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-mono uppercase tracking-wider font-bold">New Race Setup</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 mb-1">
              Create Timing Session
            </h2>
            <p className="text-xs font-mono text-slate-400 mb-6">
              Set planned distance, runner name, and timing checkpoints with auto-generated Join Codes
            </p>

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-mono">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateRaceSubmit} className="space-y-6">
              
              {/* Primary Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                    Race / Event Name
                  </label>
                  <input
                    type="text"
                    required
                    value={raceName}
                    onChange={(e) => setRaceName(e.target.value)}
                    placeholder="e.g. 5K Time Trial"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                    Runner Name
                  </label>
                  <input
                    type="text"
                    required
                    value={runnerName}
                    onChange={(e) => setRunnerName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Total Planned Distance & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                    Planned Distance (Meters)
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    step={100}
                    value={totalPlannedDist}
                    onChange={(e) => setTotalPlannedDist(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                    Equivalent: {(totalPlannedDist / 1000).toFixed(2)} km / {(totalPlannedDist / 1609.34).toFixed(2)} mi
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                    Display Unit
                  </label>
                  <select
                    value={displayUnit}
                    onChange={(e) => setDisplayUnit(e.target.value as DistanceUnit)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="KILOMETERS">Kilometers (km, min/km)</option>
                    <option value="MILES">Miles (mi, min/mi)</option>
                    <option value="METERS">Meters (m, m/s)</option>
                  </select>
                </div>
              </div>

              {/* Checkpoints Configuration List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span>Timing Gates & Checkpoints ({wizardCheckpoints.length})</span>
                    </h3>
                    <p className="text-[11px] font-mono text-slate-500">
                      Each gate will receive a unique Join Code and printable QR card
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCheckpoint}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Gate</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {wizardCheckpoints.map((cp, idx) => (
                    <div
                      key={cp.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs font-mono"
                    >
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={cp.name}
                          onChange={(e) => {
                            const updated = [...wizardCheckpoints];
                            updated[idx].name = e.target.value;
                            setWizardCheckpoints(updated);
                          }}
                          placeholder="Gate Name"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={cp.distanceMeters}
                            onChange={(e) => {
                              const updated = [...wizardCheckpoints];
                              updated[idx].distanceMeters = Number(e.target.value);
                              setWizardCheckpoints(updated);
                            }}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                          />
                          <span className="text-[10px] text-slate-500">m</span>
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <select
                          value={cp.type}
                          onChange={(e) => {
                            const updated = [...wizardCheckpoints];
                            updated[idx].type = e.target.value as CheckpointType;
                            setWizardCheckpoints(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                        >
                          <option value="SPLIT">Split Gate</option>
                          <option value="SPLIT_AND_FINISH">Finish Line</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveCheckpoint(cp.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove Gate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateWizard(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRace}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{creatingRace ? 'Creating Race...' : 'Initialize Race & Gates'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
