import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/variables.css'; // Import design system first
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Disable service worker: unregister any existing SW and clear caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
}

if (window.caches && window.caches.keys) {
  window.caches.keys().then((keys) => {
    keys.forEach((k) => window.caches.delete(k));
  });
}

