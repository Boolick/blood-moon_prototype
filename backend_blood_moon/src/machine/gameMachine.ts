import { gameMachineSetup } from "./setup.js";
import { initialContext } from "./actions/round.js";

export const gameMachine = gameMachineSetup.createMachine({
  id: "blood-moon-game",
  initial: "lobby",
  context: initialContext as any,
  states: {
    lobby: {
      on: {
        START_GAME: {
          target: "chest_selection",
          actions: ["logEvent" as any],
        },
      },
    },
    chest_selection: {
      always: [{ target: "game_over", guard: "isGameOver" }],
      on: {
        SELECT_CHEST: {
          actions: ["selectChest" as any],
        },
        NEXT_PHASE: {
          target: "battle_phase",
          guard: "isChestSelected",
          actions: ["logEvent" as any],
        },
      },
    },
    battle_phase: {
      on: {
        NEXT_PHASE: {
          target: "chest_reveal",
          actions: ["logEvent" as any, "resolveBattleLogic" as any],
        },
        USE_CONSUMABLE: {
          actions: ["useConsumable" as any],
        },
      },
    },
    chest_reveal: {
      entry: ["revealChestCards" as any],
      always: [{ target: "game_over", guard: "isGameOver" }],
      on: {
        NEXT_PHASE: {
          target: "rest_phase",
          actions: ["logEvent" as any],
        },
      },
    },
    rest_phase: {
      always: [{ target: "game_over", guard: "isGameOver" }],
      on: {
        EQUIP_ITEM: {
          actions: ["equipItem" as any],
        },
        UNEQUIP_ITEM: {
          actions: ["unequipItem" as any],
        },
        DISCARD_ITEM: {
          actions: ["discardItem" as any],
        },
        USE_CONSUMABLE: {
          actions: ["useConsumable" as any],
        },
        END_ROUND: {
          target: "chest_selection",
          guard: "isInventoryValid",
          actions: ["logEvent" as any, "incrementRound" as any],
        },
      },
    },
    game_over: {
      on: {
        RESTART_GAME: {
          target: "lobby",
          actions: ["resetGame" as any, "logEvent" as any],
        },
      },
    },
  },
});
