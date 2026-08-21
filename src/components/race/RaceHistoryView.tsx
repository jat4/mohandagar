/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Race } from '../../types/race';
import { formatDistance } from '../../utils/raceCalculations';
import { 
  History, 
  Trash2, 
  ExternalLink, 
  Trophy, 
  Timer, 
  CheckCircle2, 
  Calendar, 
  User, 
  Flag, 
  Search,
  Zap,
  Play
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface RaceHistoryViewProps {
  races: Race[];
  currentUserId?: string;
  onSelectRace: (race: Race) => void;
  onDeleteRace: (raceId: string, joinCodes: string[]) => Promise<void>;
  onViewResults: (race: Race) => void;
  onBackToDashboard: () => void;
}

export const RaceHistoryView: React.FC<RaceHistoryViewProps> = ({
  races,
  currentUserId,
  onSelectRace,
  onDeleteRace,
  onViewResults,
  onBackToDashboard
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FINISHED' | 'RUNNING' | 'READY'>('ALL');
  
  // Delete confirmation state
  const [raceToDelete, setRaceToDelete] = useState<Race | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredRaces = races.filter((race) => {
    const matchesSearch = 
      race.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      race.runnerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return race.status === statusFilter;
  });

  const handleConfirmDelete = async () => {
    if (!raceToDelete) return;
    setDeleting(true);
    try {
      const joinCodes = raceToDelete.checkpoints.map((c) => c.joinCode);
      await onDeleteRace(raceToDelete.id, joinCodes);
      setRaceToDelete(null);
    } catch (err) {
      console.error('Failed to delete race:', err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search/Filters Bar */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2.5">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Race History & Past Results</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            All race sessions created by your account. Review final timings or permanently delete old races.
          </p>
        </div>

        {/* Search Input & Status Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search race or runner..."
              className="pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 w-48 sm:w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Races ({races.length})</option>
            <option value="FINISHED">Finished</option>
            <option value="RUNNING">In Progress</option>
            <option value="READY">Ready / Setup</option>
          </select>
        </div>
      </div>

      {/* Races List Grid */}
      {filteredRaces.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Races Found</h3>
          <p className="text-xs text-slate-500 font-mono max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No races match your active search filter.'
              : 'You have not hosted any races yet. Create a new race from the dashboard to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRaces.map((race) => {
            const isCreator = currentUserId ? race.hostUid === currentUserId : true;
            const isFinished = race.status === 'FINISHED';
            const isRunning = race.status === 'RUNNING';

            return (
              <div
                key={race.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDate(race.createdAt)}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {isFinished && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>FINISHED</span>
                        </span>
                      )}
                      {isRunning && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span>RUNNING</span>
                        </span>
                      )}
                      {race.status === 'READY' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                          READY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Runner Name */}
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {race.name}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-300">
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <User className="w-3.5 h-3.5" />
                      <span className="font-bold">{race.runnerName}</span>
                    </div>
                    <div className="text-slate-600">•</div>
                    <div className="text-slate-400">
                      Distance: <strong className="text-slate-200">{formatDistance(race.totalPlannedDistanceMeters, race.displayUnit)}</strong>
                    </div>
                    <div className="text-slate-600">•</div>
                    <div className="text-slate-400">
                      Checkpoints: <strong className="text-slate-200">{race.checkpoints.length}</strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isFinished ? (
                      <button
                        onClick={() => onViewResults(race)}
                        className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>View Results</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectRace(race)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Open Dashboard</span>
                      </button>
                    )}

                    {/* Secondary details link */}
                    {isFinished && (
                      <button
                        onClick={() => onSelectRace(race)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Open full controller view"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Details</span>
                      </button>
                    )}
                  </div>

                  {/* Permanently Delete Button (Allowed for creator) */}
                  {isCreator && (
                    <button
                      onClick={() => setRaceToDelete(race)}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer"
                      title="Permanently Delete Race"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Permanent Delete */}
      <ConfirmModal
        isOpen={Boolean(raceToDelete)}
        title="Delete this race permanently?"
        message="This will permanently delete the race, checkpoints, timing data, staff sessions and published public results. This action cannot be undone."
        confirmText="Delete Permanently"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRaceToDelete(null)}
      />

    </div>
  );
};
