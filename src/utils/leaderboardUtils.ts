/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PublishedResult } from '../types/race';
import { formatTimeMs } from './raceCalculations';

export interface StandardDistance {
  id: string;
  label: string;
  shortLabel: string;
  meters: number;
}

export const SUPPORTED_DISTANCES: StandardDistance[] = [
  { id: '100m', label: '100 m', shortLabel: '100 m', meters: 100 },
  { id: '200m', label: '200 m', shortLabel: '200 m', meters: 200 },
  { id: '400m', label: '400 m', shortLabel: '400 m', meters: 400 },
  { id: '600m', label: '600 m', shortLabel: '600 m', meters: 600 },
  { id: '800m', label: '800 m', shortLabel: '800 m', meters: 800 },
  { id: '1000m', label: '1000 m (1 km)', shortLabel: '1000 m', meters: 1000 },
  { id: '1200m', label: '1200 m (1.2 km)', shortLabel: '1200 m', meters: 1200 },
  { id: '1500m', label: '1500 m (1.5 km)', shortLabel: '1500 m', meters: 1500 },
  { id: '1600m', label: '1600 m (1.6 km / 1 Mile)', shortLabel: '1600 m', meters: 1600 },
  { id: '3000m', label: '3000 m (3 km)', shortLabel: '3000 m', meters: 3000 },
  { id: '4800m', label: '4800 m (4.8 km / 3 Miles)', shortLabel: '4800 m', meters: 4800 },
  { id: '5000m', label: '5000 m (5 km)', shortLabel: '5 km', meters: 5000 },
  { id: '10km', label: '10 km (10,000 m)', shortLabel: '10 km', meters: 10000 },
  { id: '12km', label: '12 km (12,000 m)', shortLabel: '12 km', meters: 12000 },
  { id: '15km', label: '15 km (15,000 m)', shortLabel: '15 km', meters: 15000 },
  { id: 'half_marathon', label: 'Half Marathon — 21.0975 km', shortLabel: 'Half Marathon', meters: 21097.5 },
  { id: 'marathon', label: 'Marathon — 42.195 km', shortLabel: 'Marathon', meters: 42195 }
];

export interface AgeCategory {
  id: string;
  group: 'YOUTH' | 'OPEN' | 'MASTERS';
  label: string;
  minAge: number;
  maxAge: number;
  isCombinedOpen?: boolean;
}

export const AGE_CATEGORIES: AgeCategory[] = [
  // YOUTH / JUNIORS
  { id: 'under_12', group: 'YOUTH', label: 'Under 12', minAge: 0, maxAge: 11 },
  { id: '12_14', group: 'YOUTH', label: '12–14', minAge: 12, maxAge: 14 },
  { id: '15_17', group: 'YOUTH', label: '15–17', minAge: 15, maxAge: 17 },

  // OPEN / SENIOR
  { id: '18_24', group: 'OPEN', label: '18–24', minAge: 18, maxAge: 24 },
  { id: '25_29', group: 'OPEN', label: '25–29', minAge: 25, maxAge: 29 },
  { id: '30_34', group: 'OPEN', label: '30–34', minAge: 30, maxAge: 34 },
  { id: '35_42', group: 'OPEN', label: '35–42', minAge: 35, maxAge: 42 },

  // MASTERS
  { id: '43_45', group: 'MASTERS', label: '43–45', minAge: 43, maxAge: 45 },
  { id: '46_50', group: 'MASTERS', label: '46–50', minAge: 46, maxAge: 50 },
  { id: '51_55', group: 'MASTERS', label: '51–55', minAge: 51, maxAge: 55 },
  { id: '56_60', group: 'MASTERS', label: '56–60', minAge: 56, maxAge: 60 },
  { id: '61_65', group: 'MASTERS', label: '61–65', minAge: 61, maxAge: 65 },
  { id: '66_70', group: 'MASTERS', label: '66–70', minAge: 66, maxAge: 70 },
  { id: '71_75', group: 'MASTERS', label: '71–75', minAge: 71, maxAge: 75 },
  { id: '76_80', group: 'MASTERS', label: '76–80', minAge: 76, maxAge: 80 },
  { id: '81_85', group: 'MASTERS', label: '81–85', minAge: 81, maxAge: 85 },
  { id: '86_90', group: 'MASTERS', label: '86–90', minAge: 86, maxAge: 90 },
  { id: '91_95', group: 'MASTERS', label: '91–95', minAge: 91, maxAge: 95 },
  { id: '96_100', group: 'MASTERS', label: '96–100', minAge: 96, maxAge: 100 },
  { id: '101_plus', group: 'MASTERS', label: '101+', minAge: 101, maxAge: 999 }
];

/**
 * Identify distance label or standard matching
 */
export function formatRaceDistanceLabel(meters: number): string {
  if (!meters || meters <= 0) return '0 m';
  const match = SUPPORTED_DISTANCES.find(
    (d) => Math.abs(d.meters - meters) <= 25 || Math.abs(d.meters - meters) / d.meters < 0.01
  );
  if (match) return match.shortLabel;
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(2)} km`;
  }
  return `${meters} m`;
}

/**
 * Check if a race's distance matches a filter category ID or meter count
 */
export function matchesDistanceFilter(distanceMeters: number, filterDistanceId: string): boolean {
  if (!filterDistanceId || filterDistanceId === 'ALL') return true;

  const target = SUPPORTED_DISTANCES.find((d) => d.id === filterDistanceId);
  if (!target) {
    // Treat as raw numeric meter filter
    const parsed = Number(filterDistanceId);
    if (!isNaN(parsed) && parsed > 0) {
      return Math.abs(distanceMeters - parsed) <= 50 || Math.abs(distanceMeters - parsed) / distanceMeters < 0.02;
    }
    return true;
  }

  return Math.abs(distanceMeters - target.meters) <= 50 || Math.abs(distanceMeters - target.meters) / target.meters < 0.02;
}

/**
 * Get runner age category label (e.g. "25–29", "18–24")
 */
export function getRunnerAgeCategoryLabel(age: number | undefined | null): string {
  if (age == null || isNaN(age) || age < 0) return '—';
  if (age < 12) return 'Under 12';
  if (age <= 14) return '12–14';
  if (age <= 17) return '15–17';
  if (age <= 24) return '18–24';
  if (age <= 29) return '25–29';
  if (age <= 34) return '30–34';
  if (age <= 42) return '35–42';
  if (age <= 45) return '43–45';
  if (age <= 50) return '46–50';
  if (age <= 55) return '51–55';
  if (age <= 60) return '56–60';
  if (age <= 65) return '61–65';
  if (age <= 70) return '66–70';
  if (age <= 75) return '71–75';
  if (age <= 80) return '76–80';
  if (age <= 85) return '81–85';
  if (age <= 90) return '86–90';
  if (age <= 95) return '91–95';
  if (age <= 100) return '96–100';
  return '101+';
}

/**
 * Check if a runner's numeric age matches the requested age category
 */
export function matchesAgeCategory(age: number | undefined | null, categoryId: string): boolean {
  if (!categoryId || categoryId === 'ALL') return true;
  if (age == null || isNaN(age)) return false;

  const cat = AGE_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return false;
  return age >= cat.minAge && age <= cat.maxAge;
}

export interface LeaderboardEntry {
  rank: number;
  tie: boolean;
  resultId: string;
  raceId: string;
  raceName: string;
  runnerName: string;
  runnerGender: 'MALE' | 'FEMALE';
  runnerAge: number | null;
  runnerAgeCategory: string;
  runnerCity: string;
  runnerState: string;
  distanceMeters: number;
  distanceFormatted: string;
  finishTimeMs: number;
  finishTimeFormatted: string;
  paceFormatted: string;
  speedFormatted: string;
  raceDate: string;
  raceTimestamp: number;
  hostName: string;
  recordedCheckpointsCount: number;
}

export interface LeaderboardFilters {
  selectedRaceId?: string; // 'ALL' or specific raceId
  selectedDistanceId?: string; // 'ALL' or standard distance ID (e.g. '5000m')
  genderFilter?: 'ALL' | 'MALE' | 'FEMALE';
  ageCategoryId?: string; // 'ALL' or specific category id (e.g. '25_29')
  selectedCity?: string; // 'ALL' or city name
  selectedState?: string; // 'ALL' or state name
  searchQuery?: string;
}

/**
 * Filter, validate and rank official published race results
 */
export function computeLeaderboard(
  results: PublishedResult[],
  filters: LeaderboardFilters
): LeaderboardEntry[] {
  // Step 1: Filter to strictly FINISHED and PUBLISHED valid results
  const valid = results.filter((res) => {
    // 1. Publication status must be strictly PUBLISHED
    if (res.resultStatus !== 'PUBLISHED') return false;

    // 2. Must have valid non-empty runner name
    if (!res.runnerName || !res.runnerName.trim()) return false;

    // 3. Must have valid positive finish time
    if (!res.totalTimeMs || res.totalTimeMs <= 0) return false;

    // 4. Must have distance
    const dist = res.actualDistanceMeters || res.totalPlannedDistanceMeters || 0;
    if (dist <= 0) return false;

    // 5. Race / Event selector filter
    if (filters.selectedRaceId && filters.selectedRaceId !== 'ALL') {
      if (res.raceId !== filters.selectedRaceId && res.id !== filters.selectedRaceId) {
        return false;
      }
    }

    // 6. Distance filter
    if (filters.selectedDistanceId && filters.selectedDistanceId !== 'ALL') {
      if (!matchesDistanceFilter(dist, filters.selectedDistanceId)) {
        return false;
      }
    }

    // 7. Gender filter (strictly using stored gender)
    const gender: 'MALE' | 'FEMALE' = res.runnerGender?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE';
    if (filters.genderFilter && filters.genderFilter !== 'ALL') {
      if (gender !== filters.genderFilter) {
        return false;
      }
    }

    // 8. Age category filter (strictly using stored age at time of race)
    if (filters.ageCategoryId && filters.ageCategoryId !== 'ALL') {
      if (!matchesAgeCategory(res.runnerAge, filters.ageCategoryId)) {
        return false;
      }
    }

    // 9. City filter
    if (filters.selectedCity && filters.selectedCity !== 'ALL') {
      const city = res.runnerCity?.trim().toLowerCase() || '';
      if (city !== filters.selectedCity.trim().toLowerCase()) {
        return false;
      }
    }

    // 10. State filter
    if (filters.selectedState && filters.selectedState !== 'ALL') {
      const state = res.runnerState?.trim().toLowerCase() || '';
      if (state !== filters.selectedState.trim().toLowerCase()) {
        return false;
      }
    }

    // 11. Search query (search runner name, race name, city, state)
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchName = res.runnerName.toLowerCase().includes(q);
      const matchRace = (res.raceName || '').toLowerCase().includes(q);
      const matchCity = (res.runnerCity || '').toLowerCase().includes(q);
      const matchState = (res.runnerState || '').toLowerCase().includes(q);
      if (!matchName && !matchRace && !matchCity && !matchState) {
        return false;
      }
    }

    return true;
  });

  // Step 2: Sort by official finish time ascending (fastest finish time = rank 1)
  valid.sort((a, b) => {
    if (a.totalTimeMs !== b.totalTimeMs) {
      return a.totalTimeMs - b.totalTimeMs;
    }
    // Secondary sort: most recent race
    return (b.publishedAt || 0) - (a.publishedAt || 0);
  });

  // Step 3: Compute dense/competition ranks
  const entries: LeaderboardEntry[] = [];
  let currentRank = 1;

  valid.forEach((res, idx) => {
    const dist = res.actualDistanceMeters || res.totalPlannedDistanceMeters || 0;
    const gender: 'MALE' | 'FEMALE' = res.runnerGender?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE';
    const ageVal = res.runnerAge != null && !isNaN(Number(res.runnerAge)) ? Number(res.runnerAge) : null;

    let rank = idx + 1;
    let tie = false;

    if (idx > 0) {
      const prev = valid[idx - 1];
      if (prev.totalTimeMs === res.totalTimeMs) {
        rank = entries[idx - 1].rank;
        tie = true;
        entries[idx - 1].tie = true;
      } else {
        rank = idx + 1;
      }
    }

    entries.push({
      rank,
      tie,
      resultId: res.id,
      raceId: res.raceId || res.id,
      raceName: res.raceName || 'Time Trial',
      runnerName: res.runnerName,
      runnerGender: gender,
      runnerAge: ageVal,
      runnerAgeCategory: getRunnerAgeCategoryLabel(ageVal),
      runnerCity: res.runnerCity?.trim() || '—',
      runnerState: res.runnerState?.trim() || '—',
      distanceMeters: dist,
      distanceFormatted: formatRaceDistanceLabel(dist),
      finishTimeMs: res.totalTimeMs,
      finishTimeFormatted: res.totalTimeFormatted || formatTimeMs(res.totalTimeMs, true),
      paceFormatted: res.averagePaceFormatted || '—',
      speedFormatted: res.averageSpeedFormatted || '—',
      raceDate: res.dateFormatted || new Date(res.publishedAt || Date.now()).toLocaleDateString(),
      raceTimestamp: res.publishedAt || 0,
      hostName: res.hostName || 'Race Host',
      recordedCheckpointsCount: res.recordedCheckpointsCount || 0
    });
  });

  return entries;
}
