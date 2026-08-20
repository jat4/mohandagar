/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, authLoading, isHost } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-100 font-mono">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3 shadow-xl">
          <Activity className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="text-xs text-slate-300">Checking Host Authorization...</span>
        </div>
      </div>
    );
  }

  if (!currentUser || !isHost) {
    const redirectUrl = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectUrl)}`} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
