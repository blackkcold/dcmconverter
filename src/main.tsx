import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { registerPWA } from './pwa/updatePrompt';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element missing');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

registerPWA();