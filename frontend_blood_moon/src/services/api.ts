import { Chest } from '../entities/types';

export async function fetchInitialData(): Promise<{ chests: Chest[] }> {
  const response = await fetch('/api/game/initial-data');
  if (!response.ok) {
    throw new Error(`Сбой связи с Дворцом: HTTP ${response.status}`);
  }
  return await response.json();
}
