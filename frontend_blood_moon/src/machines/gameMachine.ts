import { setup, assign, fromPromise } from 'xstate';
import { Player, Chest } from '../entities/types';
import { fetchInitialData } from '../services/api';

export interface GameContext {
  players: Player[];
  chests: Chest[];
  globalTimer: number; // Гнев Дворца
  roundNumber: number;
  eventLog: string[];
  activeChestId: string | null;
  lastLoserId: string | null;
}

export type GameEvent =
  | { type: 'START_GAME' }
  | { type: 'SELECT_CHEST'; playerId: string; chestId: string | null }
  | { type: 'EQUIP_ITEM'; playerId: string; cardId: string }
  | { type: 'UNEQUIP_ITEM'; playerId: string; cardId: string }
  | { type: 'DISCARD_ITEM'; playerId: string; cardId: string }
  | { type: 'USE_CONSUMABLE'; playerId: string; cardId: string }
  | { type: 'RESOLVE_BATTLES' }
  | { type: 'END_ROUND' }
  | { type: 'NEXT_PHASE' }
  | { type: 'TEST_SET_CONTEXT'; context: Partial<GameContext> }
  | { type: 'RETRY' }
  | { type: 'RESTART_GAME' };

const INITIAL_CONTEXT: GameContext = {
  players: [
    { 
      id: 'p1', 
      name: 'Искатель 1', 
      gold: 10, 
      currentHealth: 10, 
      isAlive: true, 
      inventory: { 
        hand: [
          { id: 't1', type: 'TREASURE', name: 'Меч', description: '+3 Силы', strengthBonus: 3, goldValue: 5 },
          { id: 'c1', type: 'CONSUMABLE', name: 'Зелье', description: 'Хил 2', effectType: 'HEAL', value: 2 }
        ], 
        equipment: [] 
      }, 
      objectives: [] 
    },
    { 
      id: 'p2', 
      name: 'Искатель 2', 
      gold: 5, 
      currentHealth: 8, 
      isAlive: true, 
      inventory: { hand: [], equipment: [] }, 
      objectives: [] 
    }
  ] as any,
  chests: [],
  globalTimer: 10,
  roundNumber: 0,
  eventLog: ['Добро пожаловать во Дворец Атлантиды!'],
  activeChestId: null,
  lastLoserId: null,
};

/**
 * Основная стейт-машина игры "Дворец Атлантиды" (XState v5)
 */
export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  actors: {
    fetchInitialData: fromPromise(fetchInitialData)
  },
  guards: {
    // Игра заканчивается, если таймер <= 0 или остался максимум 1 выживший игрок
    isGameOver: ({ context }) => {
      const alivePlayers = context.players.filter(p => p.isAlive);
      const allChestsOpened = context.chests.length > 0 && context.chests.every(c => c.isOpened);
      return context.globalTimer <= 0 || (context.players.length > 0 && alivePlayers.length <= 1) || allChestsOpened;
    },
    // Проверка на четный раунд для "Дара с Небес"
    isEvenRound: ({ context }) => context.roundNumber % 2 === 0,
    // Проверка лимита инвентаря (макс 3 карты в руке)
    isInventoryValid: ({ context }) => {
      return context.players.every(p => p.inventory.hand.length <= 3);
    },
    // Проверка, выбран ли сундук
    isChestSelected: ({ context }) => {
      return context.activeChestId !== null;
    },
  },
  actions: {
    initializeGame: assign({
      globalTimer: 10,
      roundNumber: 0,
      eventLog: ({ context }) => [...context.eventLog, 'Игра инициализирована. Таймер гнева: 10'],
    }),
    incrementRound: assign({
      roundNumber: ({ context }) => context.roundNumber + 1,
      lastLoserId: null,
      activeChestId: null,
      eventLog: ({ context }) => [...context.eventLog, `Начало раунда ${context.roundNumber + 1}`],
    }),
    resolveBattleLogic: assign({
      players: ({ context }) => {
        const p1 = context.players[0];
        const p2 = context.players[1];
        if (!p1 || !p2) return context.players;

        const getStr = (p: any) => (p.character?.baseStrength || 5) + p.inventory.equipment.reduce((acc: number, c: any) => acc + (c.strengthBonus || 0), 0);
        
        const p1Str = getStr(p1);
        const p2Str = getStr(p2);

        let loserId = null;
        if (p1Str > p2Str) loserId = p2.id;
        else if (p2Str > p1Str) loserId = p1.id;

        return context.players.map(p => {
          if (p.id === loserId) {
            return { ...p, currentHealth: Math.max(0, p.currentHealth - 1) };
          }
          return p;
        });
      },
      lastLoserId: ({ context }) => {
        const p1 = context.players[0];
        const p2 = context.players[1];
        if (!p1 || !p2) return null;

        const getStr = (p: any) => (p.character?.baseStrength || 5) + p.inventory.equipment.reduce((acc: number, c: any) => acc + (c.strengthBonus || 0), 0);
        
        const p1Str = getStr(p1);
        const p2Str = getStr(p2);

        if (p1Str > p2Str) return p2.id;
        if (p2Str > p1Str) return p1.id;
        return null;
      },
      eventLog: ({ context }) => {
        const p1 = context.players[0];
        const p2 = context.players[1];
        if (!p1 || !p2) return [...context.eventLog, 'Битвы за сундуки завершены.'];

        const getStr = (p: any) => (p.character?.baseStrength || 5) + p.inventory.equipment.reduce((acc: number, c: any) => acc + (c.strengthBonus || 0), 0);
        
        const p1Str = getStr(p1);
        const p2Str = getStr(p2);

        let msg = 'Ничья! Никто не потерял здоровье.';
        if (p1Str > p2Str) msg = `${p1.name} побеждает! ${p2.name} теряет 1 HP.`;
        else if (p2Str > p1Str) msg = `${p2.name} побеждает! ${p1.name} теряет 1 HP.`;

        return [...context.eventLog, msg];
      }
    }),
    revealChestCards: assign({
      players: ({ context }) => {
        const winnerId = context.players.find(p => p.id !== context.lastLoserId)?.id;
        if (!winnerId || !context.activeChestId) return context.players;
        
        const chest = context.chests.find(c => c.id === context.activeChestId);
        if (!chest) return context.players;

        return context.players.map(p => {
          if (p.id === winnerId) {
            return {
              ...p,
              inventory: {
                ...p.inventory,
                hand: [...p.inventory.hand, ...chest.cards]
              }
            };
          }
          return p;
        });
      },
      chests: ({ context }) => {
        if (!context.activeChestId) return context.chests;
        return context.chests.map(c => {
          if (c.id === context.activeChestId) {
            return { ...c, isOpened: true, cards: [] };
          }
          return c;
        });
      },
      eventLog: ({ context }) => {
        const winner = context.players.find(p => p.id !== context.lastLoserId);
        if (!winner || !context.activeChestId) return context.eventLog;
        return [...context.eventLog, `${winner.name} забирает содержимое сундука!`];
      }
    }),
    updateGlobalTimer: assign({
      globalTimer: ({ context }) => {
        const chest = context.chests.find(c => c.id === context.activeChestId);
        if (!chest || !chest.timerCard) return context.globalTimer;
        return context.globalTimer + chest.timerCard.timerModifier;
      },
      eventLog: ({ context }) => {
        const chest = context.chests.find(c => c.id === context.activeChestId);
        if (!chest || !chest.timerCard) return context.eventLog;
        return [...context.eventLog, `Гнев Дворца усиливается: ${chest.timerCard.name}`];
      }
    }),
    useConsumable: assign({
      players: ({ context, event }) => {
        if (event.type !== 'USE_CONSUMABLE') return context.players;
        return context.players.map(p => {
          if (p.id !== event.playerId) return p;
          const cardIndex = p.inventory.hand.findIndex(c => c.id === event.cardId);
          if (cardIndex === -1) return p;
          const card = p.inventory.hand[cardIndex];
          if (card.type !== 'CONSUMABLE') return p;

          const newHand = [...p.inventory.hand];
          newHand.splice(cardIndex, 1);

          let newHealth = p.currentHealth;
          let newGold = p.gold;
          let newChar = p.character ? { ...p.character } : {
            id: 'default_char',
            type: 'CHARACTER' as any,
            name: 'Искатель',
            description: 'Базовый персонаж',
            baseStrength: 5,
            maxHealth: 10,
            uniqueEffectId: 'none'
          };

          if (card.effectType === 'HEAL') {
            newHealth = Math.min(newChar.maxHealth, newHealth + card.value);
          } else if (card.effectType === 'STRENGTH_BUFF') {
            newChar.baseStrength += card.value;
          } else if (card.effectType === 'GOLD_BOOST') {
            newGold += card.value;
          }

          return {
            ...p,
            currentHealth: newHealth,
            gold: newGold,
            character: newChar,
            inventory: { ...p.inventory, hand: newHand }
          };
        });
      },
      eventLog: ({ context, event }) => {
        if (event.type !== 'USE_CONSUMABLE') return context.eventLog;
        const p = context.players.find(p => p.id === event.playerId);
        const card = p?.inventory.hand.find(c => c.id === event.cardId);
        if (!p || !card) return context.eventLog;
        return [...context.eventLog, `Игрок ${p.name} использовал ${card.name}`];
      }
    }),
    rollHeavensGift: assign({
      eventLog: ({ context }) => {
        if (context.roundNumber % 2 !== 0) return context.eventLog;
        const roll = Math.floor(Math.random() * 6) + 1;
        if (roll % 2 === 0) {
          return [...context.eventLog, `Дар с Небес! Выпало ${roll}. Боги благосклонны, сокровища появляются в центре зала.`];
        }
        return [...context.eventLog, `Дар с Небес не сработал. Выпало ${roll}.`];
      }
    }),
    testSetContext: assign(({ event }) => {
      if (event.type === 'TEST_SET_CONTEXT') {
        return event.context;
      }
      return {};
    }),
    resetGame: assign(INITIAL_CONTEXT),
  },
}).createMachine({
  id: 'atlantisGame',
  initial: 'lobby',
  context: INITIAL_CONTEXT,
  states: {
    lobby: {
      on: {
        START_GAME: {
          target: 'setup',
        },
        TEST_SET_CONTEXT: {
          actions: 'testSetContext',
        },
      },
    },
    setup: {
      entry: 'initializeGame',
      invoke: {
        src: 'fetchInitialData',
        onDone: {
          target: 'round_start',
          actions: assign({
            chests: ({ event }) => event.output.chests,
            eventLog: ({ context }) => [...context.eventLog, 'Сундуки успешно загружены из руин.']
          })
        },
        onError: {
          target: 'error',
          actions: assign({
            eventLog: ({ context, event }) => [...context.eventLog, `Сбой связи с Дворцом: ${event.error}`]
          })
        }
      }
    },
    error: {
      on: {
        RETRY: 'setup'
      }
    },
    round_start: {
      entry: 'incrementRound',
      always: [
        {
          target: 'game_over',
          guard: 'isGameOver',
        },
        {
          target: 'chest_selection',
        },
      ],
    },
    chest_selection: {
      // Игроки выбирают сундуки или пропускают ход
      on: {
        SELECT_CHEST: {
          actions: assign({
            activeChestId: ({ context, event }) => {
              // Не даем выбрать уже открытый сундук
              const chest = context.chests.find(c => c.id === event.chestId);
              if (chest && chest.isOpened) return context.activeChestId;
              return event.chestId;
            },
            eventLog: ({ context, event }) => {
              const chest = context.chests.find(c => c.id === event.chestId);
              if (chest && chest.isOpened) return context.eventLog;
              return [...context.eventLog, `Игрок ${event.playerId} выбрал сундук ${event.chestId}`];
            }
          })
        },
        NEXT_PHASE: {
          target: 'battle_phase',
          guard: 'isChestSelected',
        },
      },
    },
    battle_phase: {
      // Сражения за сундуки
      on: {
        RESOLVE_BATTLES: {
          actions: 'resolveBattleLogic',
          target: 'chest_reveal',
        },
        USE_CONSUMABLE: {
          actions: 'useConsumable'
        }
      },
    },
    chest_reveal: {
      entry: ['revealChestCards', 'updateGlobalTimer'],
      always: [
        {
          target: 'game_over',
          guard: 'isGameOver',
        },
      ],
      on: {
        NEXT_PHASE: {
          target: 'rest_phase',
        },
      },
    },
    rest_phase: {
      // Привал: продажа, экипировка, лечение
      entry: ['rollHeavensGift'],
      always: [
        {
          target: 'game_over',
          guard: 'isGameOver',
        },
      ],
      on: {
        EQUIP_ITEM: {
          actions: assign({
            players: ({ context, event }) => {
              return context.players.map(p => {
                if (p.id !== event.playerId) return p;
                
                const cardIndex = p.inventory.hand.findIndex(c => c.id === event.cardId);
                if (cardIndex === -1) return p;
                
                const card = p.inventory.hand[cardIndex];
                
                if (card.type === 'TREASURE') {
                  const treasureCount = p.inventory.equipment.filter((c: any) => c.type === 'TREASURE').length;
                  if (treasureCount >= 2) {
                    return p; // Limit reached
                  }
                }
                
                const newHand = [...p.inventory.hand];
                newHand.splice(cardIndex, 1);
                
                return {
                  ...p,
                  inventory: {
                    hand: newHand,
                    equipment: [...p.inventory.equipment, { ...card, isEquipped: true } as any]
                  }
                };
              });
            },
            eventLog: ({ context, event }) => [...context.eventLog, `Игрок ${event.playerId} экипировал предмет`]
          })
        },
        UNEQUIP_ITEM: {
          actions: assign({
            players: ({ context, event }) => {
              return context.players.map(p => {
                if (p.id !== event.playerId) return p;
                
                const cardIndex = p.inventory.equipment.findIndex(c => c.id === event.cardId);
                if (cardIndex === -1) return p; // Card not in equipment
                
                if (p.inventory.hand.length >= 3) return p; // Hand is full
                
                const card = p.inventory.equipment[cardIndex];
                const newEquipment = [...p.inventory.equipment];
                newEquipment.splice(cardIndex, 1);
                
                return {
                  ...p,
                  inventory: {
                    equipment: newEquipment,
                    hand: [...p.inventory.hand, { ...card, isEquipped: false } as any]
                  }
                };
              });
            },
            eventLog: ({ context, event }) => [...context.eventLog, `Игрок ${event.playerId} снял предмет с экипировки`]
          })
        },
        DISCARD_ITEM: {
          actions: assign({
            players: ({ context, event }) => {
              return context.players.map(p => {
                if (p.id !== event.playerId) return p;
                
                // Check hand first
                const inHand = p.inventory.hand.some(c => c.id === event.cardId);
                if (inHand) {
                  return {
                    ...p,
                    inventory: {
                      ...p.inventory,
                      hand: p.inventory.hand.filter(c => c.id !== event.cardId)
                    }
                  };
                }
                
                // Check equipment
                const inEquip = p.inventory.equipment.some(c => c.id === event.cardId);
                if (inEquip) {
                  return {
                    ...p,
                    inventory: {
                      ...p.inventory,
                      equipment: p.inventory.equipment.filter(c => c.id !== event.cardId)
                    }
                  };
                }
                
                return p;
              });
            },
            eventLog: ({ context, event }) => [...context.eventLog, `Игрок ${event.playerId} сбросил предмет`]
          })
        },
        USE_CONSUMABLE: {
          actions: 'useConsumable'
        },
        END_ROUND: {
          target: 'round_start',
          guard: 'isInventoryValid',
        },
        TEST_SET_CONTEXT: {
          actions: 'testSetContext',
        },
      },
    },
    game_over: {
      entry: assign({
        eventLog: ({ context }) => [...context.eventLog, 'Игра окончена. Производится финальный подсчет очков...']
      }),
      on: {
        RESTART_GAME: {
          target: 'lobby',
          actions: 'resetGame'
        }
      }
    },
  },
});
