/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NavItemKey = 'home' | 'join' | 'results' | 'leaderboard' | 'dashboard' | 'races';

/**
 * Centralized route-matching function for determining active navigation state.
 * Both desktop and mobile navigation use this exact logic so active states remain 100% unified.
 *
 * Rules:
 * - /home (or /) -> 'home'
 * - /join, /join/*, /checkpoint/* -> 'join'
 * - /results/leaderboard -> 'leaderboard'
 * - /results, /results/*, /activity/* -> 'results'
 * - /host/races, /host/races/* -> 'races' (ONLY 'races', NEVER 'dashboard')
 * - /host/dashboard, /host/race/new, /host/race/:raceId -> 'dashboard' (NEVER 'races')
 */
export function getActiveNavItem(pathname: string): NavItemKey | null {
  const clean = (pathname || '/').trim();

  // 1. Home
  if (clean === '/' || clean === '/home') {
    return 'home';
  }

  // 2. Join Checkpoint
  if (clean === '/join' || clean.startsWith('/join/') || clean.startsWith('/checkpoint/')) {
    return 'join';
  }

  // 3. Leaderboard
  if (clean === '/results/leaderboard' || clean.startsWith('/results/leaderboard/')) {
    return 'leaderboard';
  }

  // 4. Race Results
  if (clean === '/results' || clean.startsWith('/results/') || clean.startsWith('/activity/')) {
    return 'results';
  }

  // 5. Race History (explicit check to ensure /host/races NEVER triggers dashboard)
  if (clean === '/host/races' || clean.startsWith('/host/races/')) {
    return 'races';
  }

  // 6. Host Dashboard and child race-management workflows (/host/dashboard, /host/race/new, /host/race/:raceId)
  if (
    clean === '/host/dashboard' ||
    clean.startsWith('/host/dashboard/') ||
    clean === '/host/race/new' ||
    clean.startsWith('/host/race/')
  ) {
    return 'dashboard';
  }

  return null;
}
