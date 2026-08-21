/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Returns the exact authoritative page title for each route according to specification.
 */
export function getRouteTitle(pathname: string): string {
  const cleanPath = (pathname || '/').trim();

  // 1. Exact matches
  if (cleanPath === '/' || cleanPath === '/home') {
    return 'Runner Stopwatch';
  }
  if (cleanPath === '/results') {
    return 'Result';
  }
  if (cleanPath === '/results/leaderboard') {
    return 'Leaderboard – Runner Stopwatch';
  }
  if (cleanPath === '/host' || cleanPath === '/host/dashboard') {
    return 'Runner Stopwatch – Host';
  }
  if (cleanPath === '/host/race/new') {
    return 'Create Race – Runner Stopwatch';
  }
  if (cleanPath === '/host/races') {
    return 'Runner Stopwatch – Host';
  }
  if (cleanPath === '/join') {
    return 'Join Checkpoint – Runner Stopwatch';
  }
  if (cleanPath === '/how-it-works') {
    return 'How It Works – Runner Stopwatch';
  }
  if (cleanPath === '/privacy-policy') {
    return 'Privacy Policy – Runner Stopwatch';
  }
  if (cleanPath === '/terms-of-service') {
    return 'Terms of Service – Runner Stopwatch';
  }

  // 2. Sub-paths & Dynamic Parameters
  // Host Race Results: /host/race/:raceId/results
  if (/^\/host\/race\/[^/]+\/results\/?$/.test(cleanPath)) {
    return 'Race Result – Runner Stopwatch';
  }
  
  // Host Race Gates & Checkpoints: /host/race/:raceId/checkpoints
  if (/^\/host\/race\/[^/]+\/checkpoints\/?$/.test(cleanPath)) {
    return 'Race – Runner Stopwatch';
  }

  // Host Race Dashboard: /host/race/:raceId
  if (/^\/host\/race\/[^/]+\/?$/.test(cleanPath)) {
    return 'Race – Runner Stopwatch';
  }

  // Checkpoint Staff Timing Screen: /checkpoint/:checkpointId
  if (/^\/checkpoint\/[^/]+\/?$/.test(cleanPath)) {
    return 'Checkpoint – Runner Stopwatch';
  }

  // Checkpoint QR Join Screen: /join/:code
  if (/^\/join\/[^/]+\/?$/.test(cleanPath)) {
    return 'Join Checkpoint – Runner Stopwatch';
  }

  // Public Result Detail: /results/:resultId
  if (/^\/results\/[^/]+\/?$/.test(cleanPath)) {
    return 'Result – Runner Stopwatch';
  }

  // Activity Result Card: /activity/:activityId
  if (/^\/activity\/[^/]+\/?$/.test(cleanPath)) {
    return 'Result – Runner Stopwatch';
  }

  // Auth pages
  if (cleanPath === '/login' || cleanPath === '/register') {
    return 'Runner Stopwatch – Host';
  }

  return 'Runner Stopwatch';
}

/**
 * RouteTitleManager: Centralized component listening to React Router's location
 * and immediately applying the exact page title to the browser document.
 */
export const RouteTitleManager: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const title = getRouteTitle(location.pathname);
    document.title = title;
  }, [location.pathname]);

  return null;
};
