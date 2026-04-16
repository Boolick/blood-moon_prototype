import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Настройка Service Worker для перехвата запросов в браузере
export const worker = setupWorker(...handlers);
