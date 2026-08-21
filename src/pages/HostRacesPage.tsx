/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RaceService } from '../services/raceService';
import { Race } from '../types/race';
import { RaceHistoryView } from '../components/race/RaceHistoryView';
import { History, Plus, ArrowLeft, Timer, Activity } from 'lucide-react';

export const HostRacesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = RaceService.subscribeToHostRaces(
      currentUser.uid,
      (list) => {
        setRaces(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Host races query warning:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [currentUser?.uid]);

  const handleDeleteRace = async (raceId: string, joinCodes: string[]) => {
    try {
      await RaceService.deleteRace(raceId, joinCodes);
      showToast({
        type: 'info',
        title: 'Race Deleted',
        message: 'Race and all sub-collections have been removed.'
      });
    } catch (err: any) {
      console.error(err);
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete race.'
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-16">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/host/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <Link
          to="/host/race/new"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Race</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center font-mono text-slate-400 gap-3">
          <Activity className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="text-xs">Loading Race History from Firebase...</span>
        </div>
      ) : (
        <RaceHistoryView
          races={races}
          currentUserId={currentUser?.uid}
          onSelectRace={(r) => navigate(`/host/race/${r.id}`)}
          onViewResults={(r) => navigate(`/host/race/${r.id}/results`)}
          onDeleteRace={handleDeleteRace}
          onBackToDashboard={() => navigate('/host/dashboard')}
        />
      )}

    </div>
  );
};
