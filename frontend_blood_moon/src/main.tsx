import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// MSW is disabled to use real backend
// async function enableMocking() {
//   if (process.env.NODE_ENV !== 'development') {
//     return;
//   }
//   const { worker } = await import('./mocks/browser');
//   return worker.start({ onUnhandledRequest: 'bypass' });
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

