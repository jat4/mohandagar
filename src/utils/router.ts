/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export type AppRoute = 
  | { name: 'host-home' }
  | { name: 'host-live'; raceId: string }
  | { name: 'host-summary'; raceId: string }
  | { name: 'join'; joinCode?: string }
  | { name: 'staff'; raceId: string; checkpointId: string; joinCode?: string; staffName?: string };

export interface BreadcrumbItem {
  label: string;
  route?: AppRoute;
  active?: boolean;
}

/**
 * Parses the current window.location into a strongly typed AppRoute.
 * Supports both hash routing (#/host/live?raceId=...) and query params (?join=...).
 */
export function parseCurrentRoute(): AppRoute {
  if (typeof window === 'undefined') {
    return { name: 'host-home' };
  }

  // 1. Check direct query params (for backwards compatibility / direct QR codes)
  const searchParams = new URLSearchParams(window.location.search);
  const directJoinCode = searchParams.get('join') || searchParams.get('code');
  if (directJoinCode && !window.location.hash) {
    return { name: 'join', joinCode: directJoinCode.toUpperCase() };
  }

  // 2. Parse hash: e.g. "#/host/live?raceId=abc123" or "#/join/8K4P-29"
  const rawHash = window.location.hash.replace(/^#\/?/, '');
  if (!rawHash) {
    return { name: 'host-home' };
  }

  const [pathPart, queryPart] = rawHash.split('?');
  const params = new URLSearchParams(queryPart || '');
  const segments = pathPart.split('/').filter(Boolean);

  const primary = segments[0] || 'host';

  if (primary === 'host') {
    const sub = segments[1];
    if (sub === 'live') {
      const raceId = params.get('raceId') || segments[2] || '';
      return raceId ? { name: 'host-live', raceId } : { name: 'host-home' };
    }
    if (sub === 'summary') {
      const raceId = params.get('raceId') || segments[2] || '';
      return raceId ? { name: 'host-summary', raceId } : { name: 'host-home' };
    }
    return { name: 'host-home' };
  }

  if (primary === 'join') {
    const code = segments[1] || params.get('code') || params.get('join') || '';
    return { name: 'join', joinCode: code ? code.toUpperCase() : undefined };
  }

  if (primary === 'staff') {
    const raceId = params.get('raceId') || '';
    const checkpointId = params.get('checkpointId') || '';
    const joinCode = params.get('joinCode') || params.get('code') || undefined;
    const staffName = params.get('staffName') || undefined;
    if (raceId && checkpointId) {
      return { name: 'staff', raceId, checkpointId, joinCode, staffName };
    }
    return { name: 'join', joinCode };
  }

  return { name: 'host-home' };
}

/**
 * Converts an AppRoute to a browser hash string.
 */
export function routeToHash(route: AppRoute): string {
  switch (route.name) {
    case 'host-home':
      return '#/host/dashboard';
    case 'host-live':
      return `#/host/live?raceId=${encodeURIComponent(route.raceId)}`;
    case 'host-summary':
      return `#/host/summary?raceId=${encodeURIComponent(route.raceId)}`;
    case 'join':
      return route.joinCode ? `#/join/${encodeURIComponent(route.joinCode)}` : '#/join';
    case 'staff': {
      const p = new URLSearchParams();
      p.set('raceId', route.raceId);
      p.set('checkpointId', route.checkpointId);
      if (route.joinCode) p.set('joinCode', route.joinCode);
      if (route.staffName) p.set('staffName', route.staffName);
      return `#/staff?${p.toString()}`;
    }
  }
}

interface RouterContextType {
  route: AppRoute;
  navigate: (route: AppRoute, replace?: boolean) => void;
  goBack: () => void;
}

export const RouterContext = createContext<RouterContextType>({
  route: { name: 'host-home' },
  navigate: () => {},
  goBack: () => {}
});

export const useRouter = () => useContext(RouterContext);
