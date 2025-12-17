import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/variables.css'; // Import design system first
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

