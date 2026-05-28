import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css'; // Make sure Tailwind is configured in this file

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
