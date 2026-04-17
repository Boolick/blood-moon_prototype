import { setup, assign } from 'xstate';
import { GameState, GameIntent } from '@shared/contract';

export type GameContext = GameState;

export type GameEvent =
  | { type: 'SYNC_STATE'; state: GameState }
  | GameIntent;

const INITIAL_CONTEXT: GameContext = {
  players: [],
  chests: [],
  globalTimer: 10,
  roundNumber: 0,
  eventLog: ['Добро пожаловать во Дворец Атлантиды!'],
  activeChestId: null,
  lastLoserId: null,
  phase: 'lobby',
};

/**
 * Основная стейт-машина игры "Дворец Атлантиды" (XState v5)
 * Теперь она "глупая" и синхронизируется с сервером.
 */
export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  guards: {
    // Проверка лимита инвентаря (макс 3 карты в руке)
    isInventoryValid: ({ context }) => {
      const p1 = context.players.find(p => p.id === 'p1');
      return (p1?.inventory?.hand?.length || 0) <= 3;
    },
    // Проверка, выбран ли сундук
    isChestSelected: ({ context }) => {
      return context.activeChestId !== null;
    },
  },
  actions: {
    syncState: assign(({ event }) => {
      if (event.type === 'SYNC_STATE') {
        return event.state;
      }
      return {};
    }),
  },
}).createMachine({
  id: 'atlantisGame',
  initial: 'lobby',
  context: INITIAL_CONTEXT,
  on: {
    SYNC_STATE: {
      actions: 'syncState',
      target: '.checkPhase',
    },
  },
  states: {
    checkPhase: {
      always: [
        { target: 'lobby', guard: ({ context }) => context.phase === 'lobby' },
        { target: 'chest_selection', guard: ({ context }) => context.phase === 'chest_selection' },
        { target: 'battle_phase', guard: ({ context }) => context.phase === 'battle_phase' },
        { target: 'chest_reveal', guard: ({ context }) => context.phase === 'chest_reveal' },
        { target: 'rest_phase', guard: ({ context }) => context.phase === 'rest_phase' },
        { target: 'game_over', guard: ({ context }) => context.phase === 'game_over' },
      ],
    },
    lobby: {
      on: {
        START_GAME: 'syncing',
      },
    },
    chest_selection: {
      on: {
        SELECT_CHEST: 'syncing',
        NEXT_PHASE: {
          target: 'syncing',
          guard: 'isChestSelected',
        },
      },
    },
    battle_phase: {
      on: {
        NEXT_PHASE: 'syncing',
        USE_CONSUMABLE: 'syncing',
      },
    },
    chest_reveal: {
      on: {
        NEXT_PHASE: 'syncing',
      },
    },
    rest_phase: {
      on: {
        EQUIP_ITEM: 'syncing',
        UNEQUIP_ITEM: 'syncing',
        DISCARD_ITEM: 'syncing',
        USE_CONSUMABLE: 'syncing',
        END_ROUND: {
          target: 'syncing',
          guard: 'isInventoryValid',
        },
      },
    },
    game_over: {
      on: {
        RESTART_GAME: 'syncing',
      },
    },
    syncing: {
      // Состояние ожидания обновления от сервера
    },
  },
});
