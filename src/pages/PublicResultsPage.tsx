/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RaceService } from '../services/raceService';
import { PublishedResult } from '../types/race';
import { ResultQrCodeModal } from '../components/race/ResultQrCodeModal';
import { formatTimeMs } from '../utils/raceCalculations';
import { 
  Trophy, 
  Search, 
  Calendar, 
  User, 
  ArrowRight, 
  Flame, 
  Timer, 
  CheckCircle2, 
  Activity, 
  QrCode, 
  Share2, 
  Award,
  Sparkles,
  Filter
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const PublicResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [results, setResults] = useState<PublishedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResultForQr, setSelectedResultForQr] = useState<PublishedResult | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = RaceService.subscribeToPublishedResults(
      (data) => {
        setResults(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching published results:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredResults = results.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.raceName?.toLowerCase().includes(query) ||
      item.runnerName?.toLowerCase().includes(query) ||
      item.hostName?.toLowerCase().includes(query) ||
      item.dateFormatted?.toLowerCase().includes(query)
    );
  });

  const publishedCount = results.length;

  // Calculate Total Distance in km from published race distance data
  const totalDistanceKm = results.reduce((acc, curr) => {
    if (typeof curr.actualDistanceKm === 'number' && !isNaN(curr.actualDistanceKm)) {
      return acc + curr.actualDistanceKm;
    }
    const meters = curr.actualDistanceMeters || curr.totalPlannedDistanceMeters || 0;
    return acc + (meters / 1000);
  }, 0);

  // Calculate Total Official Time in ms from published race totalTimeMs data
  const totalTimeMs = results.reduce((acc, curr) => {
    const time = typeof curr.totalTimeMs === 'number' && !isNaN(curr.totalTimeMs) ? curr.totalTimeMs : 0;
    return acc + time;
  }, 0);

  const formattedTotalDistance = `${totalDistanceKm.toFixed(1)} km`;
  const formattedTotalTime = publishedCount === 0 ? '00:00:00.000' : formatTimeMs(totalTimeMs, true);

  const handleCopyLink = (result: PublishedResult, e: React.MouseEvent) => {
    e.stopPropagation();
    const domain = window.location.origin.includes('localhost') 
      ? window.location.origin 
      : 'https://mohandagar.in';
    const url = `${domain}/results/${encodeURIComponent(result.id)}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast({
        type: 'info',
        title: 'Link Copied',
        message: `Official link for ${result.raceName} copied to clipboard.`
      });
    }).catch(console.error);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-16">
      
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-3">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Official Public Timing Records</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight flex items-center gap-3">
              <span>Public Race Results</span>
            </h1>
            <p className="text-sm font-mono text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Browse published multi-checkpoint time trial records, split progressions, pace analyses, and verified athletic results from mohandagar.in.
            </p>
          </div>

          {/* Tab Switcher & Quick Stat Highlights */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs font-bold self-start sm:self-auto">
              <div className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>Race Results</span>
              </div>
              <Link
                to="/results/leaderboard"
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-900 transition-all flex items-center gap-1.5"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Leaderboard</span>
              </Link>
            </div>

            {/* 3 Summary Metric Cards: PUBLISHED RACES, TOTAL DISTANCE, TOTAL TIME */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:w-auto">
              {/* 1. PUBLISHED RACES */}
              <div className="px-3.5 sm:px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center font-mono flex flex-col justify-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">Published Races</div>
                <div className="text-lg sm:text-xl font-black text-cyan-300 tracking-tight">{publishedCount}</div>
              </div>

              {/* 2. TOTAL DISTANCE */}
              <div className="px-3.5 sm:px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center font-mono flex flex-col justify-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">Total Distance</div>
                <div className="text-lg sm:text-xl font-black text-emerald-300 tracking-tight whitespace-nowrap">
                  {formattedTotalDistance}
                </div>
              </div>

              {/* 3. TOTAL TIME */}
              <div className="px-3.5 sm:px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center font-mono flex flex-col justify-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold whitespace-nowrap">Total Time</div>
                <div className="text-sm sm:text-base font-black text-amber-300 tracking-tight font-mono whitespace-nowrap">
                  {formattedTotalTime}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by race, athlete, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded bg-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-xs font-mono text-slate-400 self-end sm:self-center">
          Showing <strong className="text-slate-200">{filteredResults.length}</strong> of <strong className="text-slate-200">{results.length}</strong> records
        </div>
      </div>

      {/* Results Grid / List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center font-mono text-slate-400 gap-3">
          <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-sm">Fetching verified race results...</span>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 font-mono space-y-4 max-w-xl mx-auto">
          <div className="p-3.5 rounded-2xl bg-slate-800/80 text-slate-400 w-fit mx-auto">
            <Trophy className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-200">
              {searchQuery ? 'No matching race results found' : 'No published race results yet'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              {searchQuery 
                ? `No race results matched "${searchQuery}". Try a different keyword or clear search filters.`
                : 'Finished races published by race hosts will appear here with official multi-checkpoint splits and performance analytics.'}
            </p>
          </div>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 transition-colors"
            >
              Reset Search
            </button>
          ) : (
            <Link
              to="/home"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
            >
              <span>Back to Home</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredResults.map((result) => (
            <div
              key={result.id}
              onClick={() => navigate(`/results/${result.id}`)}
              className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 shadow-xl flex flex-col justify-between transition-all group cursor-pointer relative overflow-hidden"
            >
              {/* Header Info */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>OFFICIAL RECORD</span>
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedResultForQr(result);
                      }}
                      title="View QR Code"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleCopyLink(result, e)}
                      title="Copy Public Link"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                  {result.raceName}
                </h2>

                <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-400 mt-1 mb-5">
                  <span className="flex items-center gap-1 text-slate-200 font-bold">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    {result.runnerName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {result.dateFormatted}
                  </span>
                </div>
              </div>

              {/* Stat Grid */}
              <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 mb-5 font-mono">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Distance</div>
                  <div className="text-sm font-bold text-cyan-300">
                    {result.actualDistanceKm?.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">km</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Time</div>
                  <div className="text-sm font-bold text-slate-100 truncate">
                    {result.totalTimeFormatted}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Avg Pace</div>
                  <div className="text-sm font-bold text-amber-300 truncate">
                    {result.averagePaceFormatted}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Speed</div>
                  <div className="text-sm font-bold text-emerald-300 truncate">
                    {result.averageSpeedFormatted}
                  </div>
                </div>
              </div>

              {/* Best Split or Checkpoints count highlight */}
              <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-800/60">
                {result.bestSplit ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] truncate max-w-[240px]">
                    <Flame className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Best Split: {result.bestSplit.segmentPaceFormatted}</span>
                  </div>
                ) : (
                  <div className="text-slate-500 text-[11px]">
                    {result.recordedCheckpointsCount || 0} Checkpoints recorded
                  </div>
                )}

                <div className="flex items-center gap-1 text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedResultForQr && (
        <ResultQrCodeModal
          isOpen={!!selectedResultForQr}
          onClose={() => setSelectedResultForQr(null)}
          result={selectedResultForQr}
        />
      )}

    </div>
  );
};
