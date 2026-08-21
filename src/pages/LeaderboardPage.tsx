/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RaceService } from '../services/raceService';
import { PublishedResult } from '../types/race';
import { 
  computeLeaderboard, 
  SUPPORTED_DISTANCES, 
  AGE_CATEGORIES, 
  LeaderboardEntry,
  formatRaceDistanceLabel 
} from '../utils/leaderboardUtils';
import { 
  Trophy, 
  Medal, 
  Award, 
  Filter, 
  Search, 
  RotateCcw, 
  Calendar, 
  MapPin, 
  User, 
  ArrowRight, 
  Flame, 
  Timer, 
  Activity, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [results, setResults] = useState<PublishedResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize filters from URL parameters if present
  const [selectedRaceId, setSelectedRaceId] = useState<string>(searchParams.get('race') || 'ALL');
  const [selectedDistanceId, setSelectedDistanceId] = useState<string>(searchParams.get('distance') || 'ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>(
    (searchParams.get('gender') as 'ALL' | 'MALE' | 'FEMALE') || 'ALL'
  );
  const [ageCategoryId, setAgeCategoryId] = useState<string>(searchParams.get('age') || 'ALL');
  const [selectedCity, setSelectedCity] = useState<string>(searchParams.get('city') || 'ALL');
  const [selectedState, setSelectedState] = useState<string>(searchParams.get('state') || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');

  // Keep URL parameters synchronized with active filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedRaceId !== 'ALL') params.set('race', selectedRaceId);
    if (selectedDistanceId !== 'ALL') params.set('distance', selectedDistanceId);
    if (genderFilter !== 'ALL') params.set('gender', genderFilter);
    if (ageCategoryId !== 'ALL') params.set('age', ageCategoryId);
    if (selectedCity !== 'ALL') params.set('city', selectedCity);
    if (selectedState !== 'ALL') params.set('state', selectedState);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());

    setSearchParams(params, { replace: true });
  }, [selectedRaceId, selectedDistanceId, genderFilter, ageCategoryId, selectedCity, selectedState, searchQuery, setSearchParams]);

  // Real-time Firestore subscription to published results
  useEffect(() => {
    setLoading(true);
    const unsubscribe = RaceService.subscribeToPublishedResults(
      (data) => {
        setResults(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading published race results for leaderboard:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute distinct list of published races for the Race filter dropdown
  const distinctRaces = useMemo(() => {
    const map = new Map<string, { id: string; name: string; dateFormatted?: string; distanceMeters: number }>();
    results.forEach((r) => {
      const id = r.raceId || r.id;
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: r.raceName || 'Time Trial',
          dateFormatted: r.dateFormatted,
          distanceMeters: r.actualDistanceMeters || r.totalPlannedDistanceMeters || 0
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [results]);

  // Compute distinct cities and states for location filters
  const distinctCities = useMemo(() => {
    const set = new Set<string>();
    results.forEach((r) => {
      if (r.runnerCity && r.runnerCity.trim() && r.runnerCity.trim() !== '—') {
        set.add(r.runnerCity.trim());
      }
    });
    return Array.from(set).sort();
  }, [results]);

  const distinctStates = useMemo(() => {
    const set = new Set<string>();
    results.forEach((r) => {
      if (r.runnerState && r.runnerState.trim() && r.runnerState.trim() !== '—') {
        set.add(r.runnerState.trim());
      }
    });
    return Array.from(set).sort();
  }, [results]);

  // Compute ranked leaderboard entries
  const leaderboardEntries = useMemo(() => {
    return computeLeaderboard(results, {
      selectedRaceId,
      selectedDistanceId,
      genderFilter,
      ageCategoryId,
      selectedCity,
      selectedState,
      searchQuery
    });
  }, [results, selectedRaceId, selectedDistanceId, genderFilter, ageCategoryId, selectedCity, selectedState, searchQuery]);

  const isAnyFilterActive = 
    selectedRaceId !== 'ALL' ||
    selectedDistanceId !== 'ALL' ||
    genderFilter !== 'ALL' ||
    ageCategoryId !== 'ALL' ||
    selectedCity !== 'ALL' ||
    selectedState !== 'ALL' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedRaceId('ALL');
    setSelectedDistanceId('ALL');
    setGenderFilter('ALL');
    setAgeCategoryId('ALL');
    setSelectedCity('ALL');
    setSelectedState('ALL');
    setSearchQuery('');
  };

  // Render rank badge (Gold #1, Silver #2, Bronze #3, Number #4+)
  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono font-black text-sm shadow-md shadow-amber-500/10">
          <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/30" />
          <span>#1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-400/20 border border-slate-400/50 text-slate-200 font-mono font-black text-sm">
          <Medal className="w-4 h-4 text-slate-300 fill-slate-300/30" />
          <span>#2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-700/20 border border-amber-700/50 text-amber-500 font-mono font-black text-sm">
          <Medal className="w-4 h-4 text-amber-600 fill-amber-600/30" />
          <span>#3</span>
        </div>
      );
    }
    return (
      <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono font-bold text-xs">
        #{rank}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-16">
      
      {/* Top Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-mono mb-3">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Athletic Rankings</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight flex items-center gap-3">
              <span>Leaderboard</span>
            </h1>
            <p className="text-sm font-mono text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Official results from published Runner Stopwatch races. Ranked by verified finish times across distance, gender, and masters age brackets.
            </p>
          </div>

          {/* Tab Switcher: Race Results vs. Leaderboard */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs font-bold self-start md:self-center shrink-0">
            <Link
              to="/results"
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>Race Results</span>
            </Link>
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 fill-slate-950/20" />
              <span>Leaderboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        
        {/* Gender Category Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 font-mono text-xs font-bold w-fit">
            <button
              onClick={() => setGenderFilter('ALL')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                genderFilter === 'ALL'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OVERALL
            </button>
            <button
              onClick={() => setGenderFilter('MALE')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                genderFilter === 'MALE'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MALE
            </button>
            <button
              onClick={() => setGenderFilter('FEMALE')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                genderFilter === 'FEMALE'
                  ? 'bg-fuchsia-500 text-slate-950 shadow-md shadow-fuchsia-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FEMALE
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search runner or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Multi-Select Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono text-xs">
          
          {/* 1. Race / Event Selector */}
          <div>
            <label className="block text-[11px] text-slate-400 font-bold mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Race / Event</span>
            </label>
            <select
              value={selectedRaceId}
              onChange={(e) => setSelectedRaceId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="ALL">All Published Races ({results.length})</option>
              {distinctRaces.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({formatRaceDistanceLabel(r.distanceMeters)})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Distance Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 font-bold mb-1.5 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Race Distance</span>
            </label>
            <select
              value={selectedDistanceId}
              onChange={(e) => setSelectedDistanceId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="ALL">All Distances</option>
              <optgroup label="Sprint & Middle Distance">
                <option value="100m">100 m</option>
                <option value="200m">200 m</option>
                <option value="400m">400 m</option>
                <option value="600m">600 m</option>
                <option value="800m">800 m</option>
                <option value="1000m">1000 m (1 km)</option>
                <option value="1200m">1200 m (1.2 km)</option>
                <option value="1500m">1500 m (1.5 km)</option>
                <option value="1600m">1600 m (1.6 km / 1 Mile)</option>
                <option value="3000m">3000 m (3 km)</option>
              </optgroup>
              <optgroup label="Road & Long Distance">
                <option value="4800m">4800 m (4.8 km / 3 Miles)</option>
                <option value="5000m">5000 m (5 km)</option>
                <option value="10km">10 km (10,000 m)</option>
                <option value="12km">12 km (12,000 m)</option>
                <option value="15km">15 km (15,000 m)</option>
                <option value="half_marathon">Half Marathon — 21.0975 km</option>
                <option value="marathon">Marathon — 42.195 km</option>
              </optgroup>
            </select>
          </div>

          {/* 3. Age Category Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 font-bold mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Age Category</span>
            </label>
            <select
              value={ageCategoryId}
              onChange={(e) => setAgeCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="ALL">All Age Categories</option>
              
              <optgroup label="YOUTH / JUNIORS">
                <option value="under_12">Under 12</option>
                <option value="12_14">12–14</option>
                <option value="15_17">15–17</option>
              </optgroup>

              <optgroup label="OPEN / SENIOR">
                <option value="18_24">18–24</option>
                <option value="25_29">25–29</option>
                <option value="30_34">30–34</option>
                <option value="35_42">35–42</option>
              </optgroup>

              <optgroup label="MASTERS">
                <option value="43_45">43–45</option>
                <option value="46_50">46–50</option>
                <option value="51_55">51–55</option>
                <option value="56_60">56–60</option>
                <option value="61_65">61–65</option>
                <option value="66_70">66–70</option>
                <option value="71_75">71–75</option>
                <option value="76_80">76–80</option>
                <option value="81_85">81–85</option>
                <option value="86_90">86–90</option>
                <option value="91_95">91–95</option>
                <option value="96_100">96–100</option>
                <option value="101_plus">101+</option>
              </optgroup>
            </select>
          </div>

          {/* 4. City / State Location Filter */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>City</span>
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-2.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                <option value="ALL">All Cities</option>
                {distinctCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1.5">
                <span>State</span>
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-2.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                <option value="ALL">All States</option>
                {distinctStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Filter Summary & Reset Action */}
        <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-amber-300">{leaderboardEntries.length}</strong> official rank{leaderboardEntries.length === 1 ? '' : 's'}</span>
            {leaderboardEntries.length > 0 && (
              <span className="hidden sm:inline text-slate-500">
                • Fastest: <strong className="text-slate-200">{leaderboardEntries[0].finishTimeFormatted}</strong> ({leaderboardEntries[0].runnerName})
              </span>
            )}
          </div>

          {isAnyFilterActive && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

      </div>

      {/* Leaderboard Table & Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center font-mono text-slate-400 gap-3">
          <Activity className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-sm">Calculating official leaderboard rankings...</span>
        </div>
      ) : leaderboardEntries.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 border border-slate-800 rounded-3xl p-8 font-mono space-y-4 max-w-xl mx-auto">
          <div className="p-3.5 rounded-2xl bg-slate-800/80 text-amber-400 w-fit mx-auto">
            <Trophy className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-200">
              No ranked results match these filters
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              {isAnyFilterActive
                ? 'Try broadening your race, distance, gender, age category, or location filter settings.'
                : 'Published race results from race hosts will automatically appear on the official leaderboard.'}
            </p>
          </div>
          {isAnyFilterActive ? (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          ) : (
            <Link
              to="/results"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              <span>Browse All Race Results</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* DESKTOP LEADERBOARD TABLE (Hidden on Mobile) */}
          <div className="hidden md:block bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-20">Rank</th>
                    <th className="py-3.5 px-4">Runner</th>
                    {genderFilter === 'ALL' && <th className="py-3.5 px-4 w-24">Gender</th>}
                    <th className="py-3.5 px-4 w-20">Age</th>
                    <th className="py-3.5 px-4">City</th>
                    <th className="py-3.5 px-4">State</th>
                    <th className="py-3.5 px-4">Event / Distance</th>
                    <th className="py-3.5 px-4 text-right">Finish Time</th>
                    <th className="py-3.5 px-4 text-right w-24">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {leaderboardEntries.map((entry) => (
                    <tr
                      key={`${entry.resultId}_${entry.rank}`}
                      onClick={() => navigate(`/results/${entry.resultId}`)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* 1. Rank */}
                      <td className="py-4 px-4 font-bold">
                        {renderRankBadge(entry.rank)}
                      </td>

                      {/* 2. Runner Name */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors text-sm flex items-center gap-2">
                          <span>{entry.runnerName}</span>
                          {entry.rank === 1 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-amber-300 font-normal">
                              Fastest
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                          {entry.raceDate}
                        </div>
                      </td>

                      {/* 3. Gender (Shown in Overall view) */}
                      {genderFilter === 'ALL' && (
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              entry.runnerGender === 'FEMALE'
                                ? 'bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-300'
                                : 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300'
                            }`}
                          >
                            {entry.runnerGender}
                          </span>
                        </td>
                      )}

                      {/* 4. Age & Bracket */}
                      <td className="py-4 px-4">
                        {entry.runnerAge != null ? (
                          <div>
                            <span className="text-slate-200 font-bold">{entry.runnerAge}</span>
                            <div className="text-[10px] text-slate-500 font-normal">{entry.runnerAgeCategory}</div>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* 5. City */}
                      <td className="py-4 px-4 text-slate-300">
                        {entry.runnerCity}
                      </td>

                      {/* 6. State */}
                      <td className="py-4 px-4 text-slate-300">
                        {entry.runnerState}
                      </td>

                      {/* 7. Event / Distance */}
                      <td className="py-4 px-4">
                        <div className="text-slate-200 font-medium truncate max-w-[180px]">{entry.raceName}</div>
                        <div className="text-[11px] text-cyan-400 font-bold">{entry.distanceFormatted}</div>
                      </td>

                      {/* 8. Finish Time */}
                      <td className="py-4 px-4 text-right">
                        <div className="text-base font-black text-amber-300 tracking-tight">
                          {entry.finishTimeFormatted}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {entry.paceFormatted}
                        </div>
                      </td>

                      {/* 9. Action */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/results/${entry.resultId}`}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-all inline-flex items-center justify-center"
                          title="View Split Progression & Certificate"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE RESPONSIVE CARDS (Clean card layout, NO horizontal scroll) */}
          <div className="md:hidden space-y-3">
            {leaderboardEntries.map((entry) => (
              <div
                key={`mobile_${entry.resultId}_${entry.rank}`}
                onClick={() => navigate(`/results/${entry.resultId}`)}
                className="p-4 rounded-2xl bg-slate-900/95 border border-slate-800 hover:border-amber-500/50 shadow-lg font-mono space-y-3 transition-all cursor-pointer"
              >
                {/* Header: Rank + Finish Time */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {renderRankBadge(entry.rank)}
                    <div>
                      <h3 className="text-base font-bold text-slate-100 line-clamp-1">
                        {entry.runnerName}
                      </h3>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className={`font-bold ${entry.runnerGender === 'FEMALE' ? 'text-fuchsia-400' : 'text-cyan-400'}`}>
                          {entry.runnerGender}
                        </span>
                        {entry.runnerAge != null && (
                          <>
                            <span>•</span>
                            <span>Age {entry.runnerAge} ({entry.runnerAgeCategory})</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-amber-300">
                      {entry.finishTimeFormatted}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {entry.paceFormatted}
                    </div>
                  </div>
                </div>

                {/* Location & Event Details */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">
                      {entry.runnerCity !== '—' || entry.runnerState !== '—' 
                        ? `${entry.runnerCity !== '—' ? entry.runnerCity : ''}${entry.runnerCity !== '—' && entry.runnerState !== '—' ? ', ' : ''}${entry.runnerState !== '—' ? entry.runnerState : ''}`
                        : '—'}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-cyan-400 shrink-0">
                    {entry.distanceFormatted}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="truncate max-w-[220px]">{entry.raceName}</span>
                  <div className="text-amber-400 font-bold flex items-center gap-1">
                    <span>View Record</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
