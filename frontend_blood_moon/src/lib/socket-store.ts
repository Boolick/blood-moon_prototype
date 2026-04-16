import { create } from 'zustand';
import { GameState, GameIntent } from '@shared/contract';

interface SocketStore {
  state: GameState | null;
  socket: WebSocket | null;
  error: string | null;
  connect: (url: string) => void;
  sendIntent: (intent: GameIntent) => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  state: null,
  socket: null,
  error: null,
  connect: (url) => {
    if (get().socket) return;

    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('Connected to server');
      set({ error: null });
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'STATE_UPDATE') {
        set({ state: data.payload });
      } else if (data.type === 'ERROR') {
        set({ error: data.message });
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from server');
      set({ socket: null });
      // Reconnect after delay
      setTimeout(() => get().connect(url), 2000);
    };

    socket.onerror = (err) => {
      console.error('Socket error:', err);
      set({ error: 'Socket connection error' });
    };

    set({ socket });
  },
  sendIntent: (intent) => {
    const socket = get().socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(intent));
    } else {
      console.warn('Cannot send intent, socket not connected');
    }
  },
}));
