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

// 5. High-security content protections are active on key presses and mouse actions.
// (The full screen blur/black overlay has been removed to allow smooth tab switching without interruption).

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
