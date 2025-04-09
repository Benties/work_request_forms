import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Declare QuickBase global variables
declare global {
  interface Window {
    QUICKBASE_REALM: string;
    QUICKBASE_USER_TOKEN: string;
    QUICKBASE_APP_TOKEN: string;
  }
}

// Initialize the application
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
