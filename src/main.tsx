import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// -------------------------------------------------------------
// SECURE ENVIRONMENT SUITE: ZOOM & SCREENSHOT PROTECTION
// -------------------------------------------------------------

// 1. Prevent keyboard zoom (Ctrl/Cmd +/-/0) & print screens (Ctrl/Cmd + P) & save page (Ctrl/Cmd + S)
document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  
  // Disable Print (Ctrl+P / Cmd+P)
  if ((e.ctrlKey || e.metaKey) && key === 'p') {
    e.preventDefault();
    return;
  }

  // Disable Save (Ctrl+S / Cmd+S)
  if ((e.ctrlKey || e.metaKey) && key === 's') {
    e.preventDefault();
    return;
  }

  // Disable Keyboard Zoom
  if (e.ctrlKey || e.metaKey) {
    if (key === '+' || key === '=' || key === '-' || key === '0') {
      e.preventDefault();
    }
  }
}, { capture: true });

// 2. Prevent mouse-wheel zoom with Ctrl key
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

// 3. Prevent multi-touch zoom pinch gestures
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

// 4. Intercept PrintScreen keyup event and clear clipboard
document.addEventListener('keyup', (e) => {
  if (e.key === 'PrintScreen') {
    navigator.clipboard?.writeText?.('');
  }
});

// 5. High-security content hiding on window blur / visibility change
// (Blurs/blacks out the site content when snipping tools, print screen, or device screenshotted overlays steal focus!)
const createSecurityOverlay = () => {
  let overlay = document.getElementById('security-shield-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'security-shield-overlay';
    overlay.className = 'fixed inset-0 z-[999999] bg-[#090a0f] text-white flex flex-col items-center justify-center gap-3 select-none transition-opacity duration-300 pointer-events-auto';
    overlay.style.opacity = '0';
    overlay.style.display = 'none';
    
    overlay.innerHTML = `
      <div class="p-6 bg-red-500/10 border border-red-500/25 rounded-3xl flex flex-col items-center text-center max-w-sm px-8 animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgb(239, 68, 68)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <h2 class="text-lg font-black tracking-tight text-white mb-1.5 uppercase">Security Shield Active</h2>
        <p class="text-xs text-gray-400 leading-relaxed font-semibold">
          Screen capture and sharing is restricted. Switch back to this window to resume your secure session.
        </p>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
};

const showSecurityOverlay = () => {
  const overlay = createSecurityOverlay();
  overlay.style.display = 'flex';
  setTimeout(() => {
    overlay.style.opacity = '1';
  }, 10);
};

const hideSecurityOverlay = () => {
  const overlay = createSecurityOverlay();
  overlay.style.opacity = '0';
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 300);
};

// Handle visibility and focus events
window.addEventListener('blur', showSecurityOverlay);
window.addEventListener('focus', hideSecurityOverlay);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    showSecurityOverlay();
  } else {
    hideSecurityOverlay();
  }
});

// 6. Disable contextual menu (right-click) globally and image dragging to stop easy content-saving
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
}, { capture: true });

document.addEventListener('dragstart', (e) => {
  if ((e.target as HTMLElement).tagName === 'IMG') {
    e.preventDefault();
  }
}, { capture: true });

// -------------------------------------------------------------

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
