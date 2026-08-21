/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getActiveNavItem } from '../../utils/navigation';
import { 
  Timer, 
  QrCode, 
  LogIn, 
  LogOut, 
  User, 
  History, 
  ChevronRight, 
  Home, 
  Layers,
  Sparkles,
  Menu,
  X,
  Award
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, signOutUser, isHost } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeNav = getActiveNavItem(location.pathname);

  const handleLogout = async () => {
    try {
      await signOutUser();
      showToast({
        type: 'info',
        title: 'Signed Out',
        message: 'You have been signed out.'
      });
      navigate('/home');
    } catch (err: any) {
      console.error(err);
    }
  };

  // Generate dynamic breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    const crumbs: Array<{ label: string; to?: string }> = [
      { label: 'Home', to: '/home' }
    ];

    if (parts.length === 0 || parts[0] === 'home') {
      return crumbs;
    }

    if (parts[0] === 'login') {
      crumbs.push({ label: 'Host Login' });
    } else if (parts[0] === 'register') {
      crumbs.push({ label: 'Register Host' });
    } else if (parts[0] === 'how-it-works') {
      crumbs.push({ label: 'How It Works' });
    } else if (parts[0] === 'privacy-policy') {
      crumbs.push({ label: 'Privacy Policy' });
    } else if (parts[0] === 'terms-of-service') {
      crumbs.push({ label: 'Terms of Service' });
    } else if (parts[0] === 'results') {
      if (parts[1]) {
        crumbs.push({ label: 'Race Results', to: '/results' });
        crumbs.push({ label: `Record: ${parts[1]}` });
      } else {
        crumbs.push({ label: 'Race Results' });
      }
    } else if (parts[0] === 'join') {
      if (parts[1]) {
        crumbs.push({ label: 'Join Checkpoint', to: '/join' });
        crumbs.push({ label: `Code: ${parts[1]}` });
      } else {
        crumbs.push({ label: 'Join Checkpoint' });
      }
    } else if (parts[0] === 'checkpoint') {
      crumbs.push({ label: 'Join Checkpoint', to: '/join' });
      crumbs.push({ label: `Gate Timing: ${parts[1] || ''}` });
    } else if (parts[0] === 'activity') {
      crumbs.push({ label: 'Race Results', to: '/results' });
      crumbs.push({ label: `Record: ${parts[1] || ''}` });
    } else if (parts[0] === 'host') {
      if (parts.length === 1 || (parts.length === 2 && parts[1] === 'dashboard')) {
        crumbs.push({ label: 'Host Dashboard' });
      } else if (parts[1] === 'races') {
        crumbs.push({ label: 'Host Dashboard', to: '/host/dashboard' });
        crumbs.push({ label: 'Race History' });
      } else if (parts[1] === 'race' && parts[2]) {
        crumbs.push({ label: 'Host Dashboard', to: '/host/dashboard' });
        if (parts[2] === 'new') {
          crumbs.push({ label: 'Create New Race' });
        } else {
          crumbs.push({ label: `Race Controller`, to: `/host/race/${parts[2]}` });
          if (parts[3] === 'checkpoints') {
            crumbs.push({ label: 'Checkpoints & QR' });
          } else if (parts[3] === 'results') {
            crumbs.push({ label: 'Results & Certificate' });
          }
        }
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 shadow-lg shadow-black/40">
      
      {/* Primary Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Direct Home Link */}
        <Link 
          to="/home" 
          className="flex items-center gap-3 group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Timer className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-mono font-black text-base tracking-tight text-slate-100 group-hover:text-cyan-400 transition-colors">
              <span>RUNNER</span>
              <span className="text-cyan-400">STOPWATCH</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>mohandagar.in</span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-xs font-bold">
          <NavLink
            to="/home"
            className={
              `px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeNav === 'home'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/join"
            className={
              `px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeNav === 'join'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Join Checkpoint</span>
          </NavLink>

          <NavLink
            to="/results"
            className={
              `px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeNav === 'results'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Award className="w-3.5 h-3.5" />
            <span>Race Results</span>
          </NavLink>

          {currentUser && (
            <>
              <NavLink
                to="/host/dashboard"
                className={
                  `px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    activeNav === 'dashboard'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/host/races"
                className={
                  `px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    activeNav === 'races'
                      ? 'bg-slate-800 text-cyan-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <History className="w-3.5 h-3.5" />
                <span>Race History</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Right Action Icons & Auth User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Auth State Button */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col text-right font-mono text-[11px]">
                <span className="text-slate-200 font-bold truncate max-w-[110px] sm:max-w-[130px]">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <span className="text-cyan-400 text-[10px]">Host Active</span>
              </div>

              {/* Desktop-only direct logout button */}
              <button
                onClick={handleLogout}
                title="Sign out from Host"
                aria-label="Sign out"
                className="hidden md:flex p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              aria-label="Login"
              title="Sign in to Host Account"
              className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-cyan-950/30 whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <LogIn className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-semibold tracking-wide">Login</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 space-y-2 animate-fadeIn font-mono text-xs">
          <Link
            to="/home"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2.5 px-3 rounded-lg transition-all ${
              activeNav === 'home'
                ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/40'
                : 'bg-slate-900 text-slate-200 hover:text-cyan-400'
            }`}
          >
            Home
          </Link>
          <Link
            to="/join"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2.5 px-3 rounded-lg transition-all ${
              activeNav === 'join'
                ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/40'
                : 'bg-slate-900 text-cyan-400 font-bold hover:text-cyan-300'
            }`}
          >
            Join Checkpoint
          </Link>
          <Link
            to="/results"
            onClick={() => setMobileMenuOpen(false)}
            className={`block py-2.5 px-3 rounded-lg transition-all ${
              activeNav === 'results'
                ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/40'
                : 'bg-slate-900 text-amber-400 font-bold hover:text-amber-300'
            }`}
          >
            Race Results
          </Link>
          {currentUser && (
            <>
              <Link
                to="/host/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2.5 px-3 rounded-lg transition-all ${
                  activeNav === 'dashboard'
                    ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/40'
                    : 'bg-slate-900 text-emerald-400 font-bold hover:text-emerald-300'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/host/races"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2.5 px-3 rounded-lg transition-all ${
                  activeNav === 'races'
                    ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-300 hover:text-slate-100'
                }`}
              >
                Race History
              </Link>
            </>
          )}
          {!currentUser ? (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-bold flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-cyan-400" />
                <span>Host Login</span>
              </div>
              <span className="text-[10px] text-cyan-400/80 font-mono">Sign In →</span>
            </Link>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full text-left py-2.5 px-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 font-bold flex items-center justify-between cursor-pointer hover:bg-rose-950/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out</span>
              </div>
              <span className="text-[10px] text-rose-400/80 font-mono">End Session</span>
            </button>
          )}
        </div>
      )}

      {/* Dynamic Breadcrumbs Sub-Bar */}
      <div className="bg-slate-950/80 border-t border-slate-800/60 px-4 sm:px-6 lg:px-8 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none">
          
          <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                {idx === breadcrumbs.length - 1 || !crumb.to ? (
                  <span className="text-cyan-400 font-bold truncate max-w-[220px] sm:max-w-none">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.to}
                    className="hover:text-slate-200 transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

        </div>
      </div>

    </header>
  );
};

