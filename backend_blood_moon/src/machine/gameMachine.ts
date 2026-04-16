import { assign, setup } from "xstate";
import {
  GamePhase,
  GameState,
  GameIntent,
  GAME_CONSTANTS,
  Player,
  Chest,
} from "@shared/contract";

const initialContext: Omit<GameState, "phase"> = {
  players: [],
  chests: [],
  globalTimer: GAME_CONSTANTS.INITIAL_GLOBAL_TIMER,
  roundNumber: 1,
  eventLog: ["Игра инициализирована"],
  activeChestId: null,
  lastLoserId: null,
};

export const gameMachine = setup({
  types: {
    context: {} as Omit<GameState, "phase">,
    events: {} as GameIntent,
  },
  actions: {
    incrementRound: assign({
      roundNumber: ({ context }) => context.roundNumber + 1,
      eventLog: ({ context }) => [
        ...context.eventLog,
        `Начался раунд ${context.roundNumber + 1}`,
      ],
    }),
    logEvent: assign({
      eventLog: ({ context, event }) => [
        ...context.eventLog,
        `Получено событие: ${event.type}`,
      ],
    }),
    resetGame: assign(initialContext),
  },
}).createMachine({
  id: "blood-moon-game",
  initial: "lobby",
  context: initialContext,
  states: {
    lobby: {
      on: {
        START_GAME: {
          target: "chest_selection",
          actions: ["logEvent"],
        },
      },
    },
    chest_selection: {
      on: {
        NEXT_PHASE: {
          target: "battle_phase",
          actions: ["logEvent"],
        },
      },
    },
    battle_phase: {
      on: {
        NEXT_PHASE: {
          target: "chest_reveal",
          actions: ["logEvent"],
        },
      },
    },
    chest_reveal: {
      on: {
        NEXT_PHASE: {
          target: "rest_phase",
          actions: ["logEvent"],
        },
      },
    },
    rest_phase: {
      on: {
        END_ROUND: {
          target: "chest_selection",
          actions: ["logEvent", "incrementRound"],
        },
      },
    },
    game_over: {
      on: {
        RESTART_GAME: {
          target: "lobby",
          actions: ["resetGame", "logEvent"],
        },
      },
    },
  },
});

