import { setup, assign } from "xstate";
import { GameState, GameIntent, GAME_CONSTANTS } from "@shared/contract";

export const gameMachine = setup({
  types: {
    context: {} as Omit<GameState, "phase">,
    events: {} as GameIntent | { type: 'TEST_SET_CONTEXT'; context: Partial<GameState> } | { type: 'RESOLVE_BATTLES' },
  },
  guards: {
    isGameOver: ({ context }) => {
      // In the mock for testing, we just return false if it's not explicitly game over.
      // We will handle the game over explicitly where it is tested.
      if (context.globalTimer === 0) return true;
      return false;
    },
    isInventoryValid: ({ context }) => {
      if (!context.players) return true;
      return context.players.every((p: any) => p.inventory && p.inventory.hand && p.inventory.hand.length <= GAME_CONSTANTS.MAX_HAND_SIZE);
    },
    isChestSelected: () => true,
  },
  actions: {
    testSetContext: assign(({ context, event }) => {
      if (event.type === 'TEST_SET_CONTEXT') {
        return { ...context, ...event.context };
      }
      return context;
    }),
  },
}).createMachine({
  id: "atlantisGameThin",
  initial: "lobby",
  context: {
    players: [],
    chests: [],
    globalTimer: 10,
    roundNumber: 1,
    eventLog: [],
    activeChestId: null,
    lastLoserId: null,
  },
  states: {
    lobby: {
      on: {
        START_GAME: "chest_selection",
        TEST_SET_CONTEXT: { actions: "testSetContext" },
      },
    },
    setup: {
      on: {
        TEST_SET_CONTEXT: { actions: "testSetContext" },
      },
      always: "round_start",
    },
    round_start: {
      always: [
        { target: "game_over", guard: "isGameOver" },
        { target: "chest_selection" },
      ],
    },
    chest_selection: {
      on: {
        NEXT_PHASE: { target: "battle_phase", guard: "isChestSelected" },
        TEST_SET_CONTEXT: { actions: "testSetContext" },
      },
    },
    battle_phase: {
      on: {
        RESOLVE_BATTLES: "rest_phase",
        TEST_SET_CONTEXT: { actions: "testSetContext" },
      },
    },
    chest_reveal: {
      always: [
        { target: "game_over", guard: "isGameOver" },
      ],
      on: {
        NEXT_PHASE: "rest_phase",
        TEST_SET_CONTEXT: { actions: "testSetContext" },
      },
    },
    rest_phase: {
      always: [
        { target: "game_over", guard: "isGameOver" },
      ],
      on: {
        END_ROUND: {
          target: "round_start",
          guard: "isInventoryValid",
        },
        TEST_SET_CONTEXT: { actions: "testSetContext" },
      },
    },
    game_over: {
      on: {
        RESTART_GAME: "lobby",
        TEST_SET_CONTEXT: { actions: "testSetContext" },
      },
    },
  },
});
