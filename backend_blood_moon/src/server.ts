import { WebSocketServer, WebSocket } from 'ws';
import { createActor } from 'xstate';
import { gameMachine } from './machine/gameMachine.js';
import { GameIntent, GameState, GamePhase } from '@shared/contract';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

// Глобальный актор игры
const gameActor = createActor(gameMachine);

// Подписка на изменения стейта для рассылки всем клиентам
gameActor.subscribe((state) => {
  const currentState: GameState = {
    ...state.context,
    phase: state.value as GamePhase,
  };
  
  const payload = JSON.stringify({
    type: 'STATE_UPDATE',
    payload: currentState
  });

  // Рассылаем всем подключенным клиентам
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
});

gameActor.start();

wss.on('connection', (ws: WebSocket) => {
  console.log('Новый клиент подключился');

  // Отправляем текущее состояние новому клиенту
  const state = gameActor.getSnapshot();
  const initialState: GameState = {
    ...state.context,
    phase: state.value as GamePhase,
  };
  ws.send(JSON.stringify({ type: 'STATE_UPDATE', payload: initialState }));

  ws.on('message', (message: string) => {
    try {
      const intent: GameIntent = JSON.parse(message);
      console.log('Получен intent от клиента:', intent);
      
      // Передаем Intent в XState машину
      gameActor.send(intent);
    } catch (e) {
      console.error('Ошибка при обработке сообщения:', e);
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Неверный формат сообщения' }));
    }
  });

  ws.on('close', () => {
    console.log('Клиент отключился');
  });
});

console.log(`WebSocket сервер запущен на ws://localhost:${PORT}`);
