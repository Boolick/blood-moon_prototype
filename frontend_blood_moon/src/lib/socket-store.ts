import { create } from 'zustand';
import { GameState, GameIntent } from '@shared/contract';
import { createActor, SnapshotFrom } from 'xstate';
import { gameMachine } from '../machines/gameMachine';

export const gameActor = createActor(gameMachine).start();

interface SocketStore {
  state: GameState | null;
  snapshot: SnapshotFrom<typeof gameMachine>;
  socket: WebSocket | null;
  error: string | null;
  connect: (url: string) => void;
  sendIntent: (intent: GameIntent) => void;
}

export const useSocketStore = create<SocketStore>((set, get) => {
  gameActor.subscribe((snapshot) => {
    set({ snapshot });
  });

  return {
    state: null,
    snapshot: gameActor.getSnapshot(),
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
          gameActor.send({ type: 'SYNC_STATE', state: data.payload });
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
        gameActor.send(intent as any);
      } else {
        console.warn('Cannot send intent, socket not connected');
      }
    },
  };
});
