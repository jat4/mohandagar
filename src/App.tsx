/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { testConnection } from './lib/firebase';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HostDashboardPage } from './pages/HostDashboardPage';
import { HostRacesPage } from './pages/HostRacesPage';
import { HostCreateRacePage } from './pages/HostCreateRacePage';
import { HostRaceLivePage } from './pages/HostRaceLivePage';
import { HostRaceCheckpointsPage } from './pages/HostRaceCheckpointsPage';
import { HostRaceResultsPage } from './pages/HostRaceResultsPage';
import { JoinCheckpointPage } from './pages/JoinCheckpointPage';
import { CheckpointScreenPage } from './pages/CheckpointScreenPage';
import { ActivityResultPage } from './pages/ActivityResultPage';
import { PublicResultsPage } from './pages/PublicResultsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PublicResultDetailPage } from './pages/PublicResultDetailPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RouteTitleManager } from './components/common/RouteTitleManager';

/**
 * Migration helper to smoothly redirect legacy hash-based URLs
 * (e.g., /#/join/8K4P-29 -> /join/8K4P-29) to standard clean paths
 */
function LegacyHashRedirector() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash) {
        // Parse legacy hash paths
        if (hash.startsWith('join/')) {
          const code = hash.replace('join/', '').split('?')[0];
          navigate(`/join/${code}`, { replace: true });
        } else if (hash.startsWith('host/live')) {
          const params = new URLSearchParams(hash.split('?')[1] || '');
          const raceId = params.get('raceId');
          if (raceId) navigate(`/host/race/${raceId}`, { replace: true });
          else navigate('/host/dashboard', { replace: true });
        } else if (hash.startsWith('host/summary')) {
          const params = new URLSearchParams(hash.split('?')[1] || '');
          const raceId = params.get('raceId');
          if (raceId) navigate(`/host/race/${raceId}/results`, { replace: true });
          else navigate('/host/dashboard', { replace: true });
        } else if (hash.startsWith('host')) {
          navigate('/host/dashboard', { replace: true });
        }
      }
    }
  }, [navigate, location]);

  return null;
}

export default function App() {
  useEffect(() => {
    testConnection().catch((err) => console.warn('Firebase connection note:', err));
  }, []);

  return (
    <BrowserRouter>
      <RouteTitleManager />
      <AuthProvider>
        <ToastProvider>
          <LegacyHashRedirector />
          <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 antialiased flex flex-col justify-between">
            <Navbar />
            
            <main className="flex-1 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
              <Routes>
                {/* 1. ROOT & HOME */}
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<HomePage />} />

                {/* 2. AUTH */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* 3. PROTECTED HOST ROUTES */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/host" element={<Navigate to="/host/dashboard" replace />} />
                  <Route path="/host/dashboard" element={<HostDashboardPage />} />
                  <Route path="/host/races" element={<HostRacesPage />} />
                  <Route path="/host/race/new" element={<HostCreateRacePage />} />
                  <Route path="/host/race/:raceId" element={<HostRaceLivePage />} />
                  <Route path="/host/race/:raceId/checkpoints" element={<HostRaceCheckpointsPage />} />
                  <Route path="/host/race/:raceId/results" element={<HostRaceResultsPage />} />
                </Route>

                {/* 4. CHECKPOINT JOIN */}
                <Route path="/join" element={<JoinCheckpointPage />} />
                <Route path="/join/:code" element={<JoinCheckpointPage />} />

                {/* 5. CHECKPOINT TIMING SCREEN */}
                <Route path="/checkpoint/:checkpointId" element={<CheckpointScreenPage />} />

                {/* 6. PUBLIC RACE RESULTS & LEADERBOARD */}
                <Route path="/results" element={<PublicResultsPage />} />
                <Route path="/results/leaderboard" element={<LeaderboardPage />} />
                <Route path="/results/:resultId" element={<PublicResultDetailPage />} />

                {/* 7. ACTIVITY RESULT */}
                <Route path="/activity/:activityId" element={<ActivityResultPage />} />

                {/* 8. INFORMATION PAGES */}
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />

                {/* 9. 404 CATCH-ALL */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
