import { assign } from "xstate";
import { GameState, GAME_CONSTANTS, CardType } from "@shared/contract";

export const initialContext: Omit<GameState, "phase"> = {
  players: [
    {
      id: "p1",
      name: "Искатель 1",
      gold: GAME_CONSTANTS.INITIAL_PLAYER_GOLD,
      currentHealth: GAME_CONSTANTS.INITIAL_PLAYER_HEALTH,
      isAlive: true,
      inventory: {
        hand: [
          {
            id: "t1",
            type: CardType.TREASURE,
            name: "Меч",
            description: "+3 Силы",
            strengthBonus: 3,
            goldValue: 5,
            isEquipped: false,
          },
          {
            id: "c1",
            type: CardType.CONSUMABLE,
            name: "Зелье",
            description: "Хил 2",
            effectType: "HEAL",
            value: 2,
          },
        ],
        equipment: [],
      },
      objectives: [],
    },
    {
      id: "p2",
      name: "Искатель 2",
      gold: GAME_CONSTANTS.INITIAL_PLAYER_GOLD,
      currentHealth: GAME_CONSTANTS.INITIAL_PLAYER_HEALTH,
      isAlive: true,
      inventory: { hand: [], equipment: [] },
      objectives: [],
    },
  ],
  chests: [
    {
      id: "chest_1",
      isOpened: false,
      timerCard: {
        id: "timer_1",
        name: "Гнев Дворца -1",
        description: "Уменьшает общий таймер на 1",
        type: CardType.TIMER,
        timerModifier: -1,
      },
      cards: [
        {
          id: "treas_1",
          name: "Золотой Идол",
          description: "Древний артефакт",
          type: CardType.TREASURE,
          strengthBonus: 2,
          goldValue: 5,
          isEquipped: false,
        },
      ],
    },
    {
      id: "chest_2",
      isOpened: false,
      timerCard: null,
      cards: [
        {
          id: "treas_2",
          name: "Меч Атлантов",
          description: "Острое оружие",
          type: CardType.TREASURE,
          strengthBonus: 4,
          goldValue: 3,
          isEquipped: false,
        },
      ],
    },
  ],
  globalTimer: GAME_CONSTANTS.INITIAL_GLOBAL_TIMER,
  roundNumber: 1,
  eventLog: ["Игра инициализирована"],
  activeChestId: null,
  lastLoserId: null,
};

export const incrementRound = assign({
  roundNumber: ({ context }) => context.roundNumber + 1,
  eventLog: ({ context }) => [
    ...context.eventLog,
    `Начался раунд ${context.roundNumber + 1}`,
  ],
  activeChestId: null,
  lastLoserId: null,
});

export const logEvent = assign({
  eventLog: ({ context, event }) => [
    ...context.eventLog,
    `Действие: ${event.type}`,
  ],
});

export const resetGame = assign(initialContext);
