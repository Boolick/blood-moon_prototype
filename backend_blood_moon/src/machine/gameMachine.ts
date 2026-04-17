import { gameMachineSetup } from "./setup.js";
import { initialContext } from "./actions/round.js";

export const gameMachine = gameMachineSetup.createMachine({
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
      always: [{ target: "game_over", guard: "isGameOver" }],
      on: {
        SELECT_CHEST: {
          actions: ["selectChest"],
        },
        NEXT_PHASE: {
          target: "battle_phase",
          guard: "isChestSelected",
          actions: ["logEvent"],
        },
      },
    },
    battle_phase: {
      on: {
        NEXT_PHASE: {
          target: "chest_reveal",
          actions: ["logEvent", "resolveBattleLogic"],
        },
        USE_CONSUMABLE: {
          actions: ["useConsumable"],
        },
      },
    },
    chest_reveal: {
      entry: ["revealChestCards"],
      always: [{ target: "game_over", guard: "isGameOver" }],
      on: {
        NEXT_PHASE: {
          target: "rest_phase",
          actions: ["logEvent"],
        },
      },
    },
    rest_phase: {
      always: [{ target: "game_over", guard: "isGameOver" }],
      on: {
        EQUIP_ITEM: {
          actions: ["equipItem"],
        },
        UNEQUIP_ITEM: {
          actions: ["unequipItem"],
        },
        DISCARD_ITEM: {
          actions: ["discardItem"],
        },
        USE_CONSUMABLE: {
          actions: ["useConsumable"],
        },
        END_ROUND: {
          target: "chest_selection",
          guard: "isInventoryValid",
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
