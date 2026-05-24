/**
 * capacitor-app/main.jsx
 * SPA entry point for Capacitor (Android / iOS) builds.
 * Mounts DaisyApp directly — no TanStack Router / SSR machinery needed.
 * The daisy-flower.jsx and daisy-app.jsx prototype is fully framework-agnostic.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DaisyApp } from '../daisy-app.jsx';
import '../daisy-styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DaisyApp />
  </StrictMode>,
);
