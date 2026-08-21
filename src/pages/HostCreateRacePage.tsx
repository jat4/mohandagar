/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { RaceService } from '../services/raceService';
import { CheckpointType, DistanceUnit, normalizeCheckpointType } from '../types/race';
import { 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  ArrowLeft,
  Activity,
  Timer,
  Lock
} from 'lucide-react';

export const HostCreateRacePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

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
    { id: '1', name: 'CP 1 (Turn 1)', distanceMeters: 1000, type: 'splitFinish', assignedStaffName: 'Phone A' },
    { id: '2', name: 'CP 2 (Midpoint)', distanceMeters: 2000, type: 'splitOnly', assignedStaffName: 'Phone B' },
    { id: '3', name: 'CP 3 (Turn 3)', distanceMeters: 3000, type: 'splitFinish', assignedStaffName: 'Phone C' },
    { id: '4', name: 'CP 4 (Final Loop)', distanceMeters: 4000, type: 'splitOnly', assignedStaffName: 'Phone D' },
    { id: '5', name: 'FINISH LINE', distanceMeters: 5000, type: 'finish', assignedStaffName: 'Finish Line' }
  ]);

  const [creatingRace, setCreatingRace] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePlannedDistanceChange = (newDistance: number) => {
    setTotalPlannedDist(newDistance);
    setWizardCheckpoints((prev) =>
      prev.map((cp, idx) => {
        // Automatically sync the dedicated final Finish Line distance
        if (idx === prev.length - 1 || cp.type === 'finish' || cp.type === 'FINISH') {
          return { ...cp, distanceMeters: newDistance };
        }
        return cp;
      })
    );
  };

  const handleAddCheckpoint = () => {
    const count = wizardCheckpoints.length;
    const normalCheckpoints = wizardCheckpoints.slice(0, count - 1);
    const finishLine = wizardCheckpoints[count - 1];

    const prevCp = normalCheckpoints[normalCheckpoints.length - 1];
    const newDistance = prevCp ? prevCp.distanceMeters + 1000 : 1000;
    const newId = `${Date.now()}`;
    const newCp = {
      id: newId,
      name: `CP ${normalCheckpoints.length + 1}`,
      distanceMeters: newDistance,
      type: 'splitFinish' as CheckpointType,
      assignedStaffName: `Phone ${String.fromCharCode(65 + (normalCheckpoints.length % 26))}`
    };

    if (finishLine) {
      setWizardCheckpoints([...normalCheckpoints, newCp, finishLine]);
    } else {
      setWizardCheckpoints([...normalCheckpoints, newCp]);
    }
  };

  const handleRemoveCheckpoint = (id: string) => {
    const cpToRemove = wizardCheckpoints.find(cp => cp.id === id);
    if (cpToRemove && (cpToRemove.type === 'finish' || cpToRemove.type === 'FINISH')) {
      return;
    }
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

      showToast({
        type: 'success',
        title: 'Race Created',
        message: `"${newRace.name}" is ready for live timing.`
      });
      // Navigate to the newly generated race page
      navigate(`/host/race/${newRace.id}`);
    } catch (err: any) {
      console.error('Failed to create race:', err);
      setErrorMessage(err.message || 'Error creating race in cloud database.');
    } finally {
      setCreatingRace(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16 animate-fadeIn">
      {/* Back to Host Dashboard link */}
      <div className="mb-6">
        <Link
          to="/host"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Host Controller</span>
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl text-slate-100">
        <div className="flex items-center gap-2.5 mb-1 text-emerald-400">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-mono uppercase tracking-wider font-bold">New Race Setup</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mb-2">
          Create Timing Session
        </h1>
        <p className="text-xs sm:text-sm font-mono text-slate-400 mb-8">
          Set planned distance, runner name, and timing checkpoints with auto-generated Join Codes
        </p>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-mono">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleCreateRaceSubmit} className="space-y-6">
          
          {/* Primary Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                Race / Event Name *
              </label>
              <input
                type="text"
                required
                value={raceName}
                onChange={(e) => setRaceName(e.target.value)}
                placeholder="e.g. 5K Time Trial"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                Runner Name *
              </label>
              <input
                type="text"
                required
                value={runnerName}
                onChange={(e) => setRunnerName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Total Planned Distance & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                Planned Distance (Meters) *
              </label>
              <input
                type="number"
                required
                min={100}
                step={100}
                value={totalPlannedDist}
                onChange={(e) => handlePlannedDistanceChange(Number(e.target.value))}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <span className="text-[11px] font-mono text-slate-500 mt-1.5 block">
                Equivalent: {(totalPlannedDist / 1000).toFixed(2)} km / {(totalPlannedDist / 1609.34).toFixed(2)} mi
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                Display Unit *
              </label>
              <select
                value={displayUnit}
                onChange={(e) => setDisplayUnit(e.target.value as DistanceUnit)}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="KILOMETERS">Kilometers (km, min/km)</option>
                <option value="MILES">Miles (mi, min/mi)</option>
                <option value="METERS">Meters (m, m/s)</option>
              </select>
            </div>
          </div>

          {/* Checkpoints Configuration List */}
          <div className="space-y-3 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-200 font-mono flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Timing Gates & Checkpoints ({wizardCheckpoints.length})</span>
                </h2>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Each gate will receive a unique Join Code and printable QR card
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCheckpoint}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>Add Gate</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {wizardCheckpoints.map((cp, idx) => {
                const isFinalFinishLine = idx === wizardCheckpoints.length - 1;
                return (
                  <div
                    key={cp.id}
                    className={`p-3.5 rounded-2xl border grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs font-mono transition-colors ${
                      isFinalFinishLine 
                        ? 'bg-rose-950/20 border-rose-900/40' 
                        : 'bg-slate-950 border-slate-800/90'
                    }`}
                  >
                    <div className="sm:col-span-4">
                      <label className="text-[10px] text-slate-500 sm:hidden block mb-1">Gate Name</label>
                      <input
                        type="text"
                        value={cp.name}
                        onChange={(e) => {
                          const updated = [...wizardCheckpoints];
                          updated[idx].name = e.target.value;
                          setWizardCheckpoints(updated);
                        }}
                        placeholder="Gate Name"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-slate-500 sm:hidden block mb-1">Distance (Meters)</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={cp.distanceMeters}
                          onChange={(e) => {
                            const updated = [...wizardCheckpoints];
                            updated[idx].distanceMeters = Number(e.target.value);
                            setWizardCheckpoints(updated);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-[10px] text-slate-500">m</span>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-slate-500 sm:hidden block mb-1">Gate Role</label>
                      {isFinalFinishLine ? (
                        <div className="w-full px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold flex items-center justify-between select-none">
                          <span>Finish Line (Finish Only)</span>
                          <span className="text-[13px]">🔒</span>
                        </div>
                      ) : (
                        <select
                          value={normalizeCheckpointType(cp.type) === 'splitOnly' ? 'splitOnly' : 'splitFinish'}
                          onChange={(e) => {
                            const updated = [...wizardCheckpoints];
                            updated[idx].type = e.target.value as CheckpointType;
                            setWizardCheckpoints(updated);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
                        >
                          <option value="splitFinish">Split Gate (Split & Finish)</option>
                          <option value="splitOnly">Split (Split Only)</option>
                        </select>
                      )}
                    </div>

                    <div className="sm:col-span-2 flex justify-end">
                      {isFinalFinishLine ? (
                        <div className="p-2 text-rose-400/60 font-mono text-[11px] flex items-center gap-1 select-none">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Finish</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveCheckpoint(cp.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                          title="Remove Gate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons: Cancel and Submit */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/host')}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingRace}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-mono text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {creatingRace ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Creating Race...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Initialize Race & Gates</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
