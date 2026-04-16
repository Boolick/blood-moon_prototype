import { assign, setup } from "xstate";
import {
  GamePhase,
  GameState,
  GameIntent,
  GAME_CONSTANTS,
  Player,
  Chest,
  CardType,
} from "@shared/contract";
import { calculateSurvivalResource } from "@shared/utils";

const initialContext: Omit<GameState, "phase"> = {
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

export const gameMachine = setup({
  types: {
    context: {} as Omit<GameState, "phase">,
    events: {} as GameIntent,
  },
  guards: {
    isGameOver: ({ context }) => {
      const alivePlayers = context.players.filter((p) => p.isAlive);
      const allChestsOpened =
        context.chests.length > 0 && context.chests.every((c) => c.isOpened);
      return (
        context.globalTimer <= 0 ||
        (context.players.length > 0 && alivePlayers.length <= 1) ||
        allChestsOpened
      );
    },
    isChestSelected: ({ context }) => context.activeChestId !== null,
  },
  actions: {
    incrementRound: assign({
      roundNumber: ({ context }) => context.roundNumber + 1,
      eventLog: ({ context }) => [
        ...context.eventLog,
        `Начался раунд ${context.roundNumber + 1}`,
      ],
      activeChestId: null,
      lastLoserId: null,
    }),
    logEvent: assign({
      eventLog: ({ context, event }) => [
        ...context.eventLog,
        `Действие: ${event.type}`,
      ],
    }),
    selectChest: assign({
      activeChestId: ({ context, event }) => {
        if (event.type !== "SELECT_CHEST") return context.activeChestId;
        const chest = context.chests.find((c) => c.id === event.chestId);
        if (chest && chest.isOpened) return context.activeChestId;
        return event.chestId;
      },
      eventLog: ({ context, event }) => {
        if (event.type !== "SELECT_CHEST") return context.eventLog;
        return [
          ...context.eventLog,
          `Игрок ${event.playerId} выбрал сундук ${event.chestId}`,
        ];
      },
    }),
    resolveBattleLogic: assign({
      players: ({ context }) => {
        const p1 = context.players[0];
        const p2 = context.players[1];
        if (!p1 || !p2) return context.players;

        const getStr = (p: Player) =>
          (p.character?.baseStrength || GAME_CONSTANTS.BASE_CHARACTER_STRENGTH) +
          p.inventory.equipment.reduce(
            (acc, c) => acc + (c.strengthBonus || 0),
            0
          );

        const p1Str = getStr(p1);
        const p2Str = getStr(p2);

        let loserId: string | null = null;
        if (p1Str > p2Str) loserId = p2.id;
        else if (p2Str > p1Str) loserId = p1.id;

        return context.players.map((p) => {
          if (p.id === loserId) {
            const newHealth = Math.max(0, p.currentHealth - 1);
            return {
              ...p,
              currentHealth: newHealth,
              isAlive: newHealth > 0,
            };
          }
          return p;
        });
      },
      lastLoserId: ({ context }) => {
        const p1 = context.players[0];
        const p2 = context.players[1];
        if (!p1 || !p2) return null;

        const getStr = (p: Player) =>
          (p.character?.baseStrength || GAME_CONSTANTS.BASE_CHARACTER_STRENGTH) +
          p.inventory.equipment.reduce(
            (acc, c) => acc + (c.strengthBonus || 0),
            0
          );

        const p1Str = getStr(p1);
        const p2Str = getStr(p2);

        if (p1Str > p2Str) return p2.id;
        if (p2Str > p1Str) return p1.id;
        return null;
      },
      eventLog: ({ context }) => {
        const p1 = context.players[0];
        const p2 = context.players[1];
        if (!p1 || !p2) return context.eventLog;

        const getStr = (p: Player) =>
          (p.character?.baseStrength || GAME_CONSTANTS.BASE_CHARACTER_STRENGTH) +
          p.inventory.equipment.reduce(
            (acc, c) => acc + (c.strengthBonus || 0),
            0
          );

        const p1Str = getStr(p1);
        const p2Str = getStr(p2);

        let msg = "Ничья! Никто не потерял здоровье.";
        if (p1Str > p2Str) msg = `${p1.name} побеждает! ${p2.name} теряет 1 HP.`;
        else if (p2Str > p1Str)
          msg = `${p2.name} побеждает! ${p1.name} теряет 1 HP.`;

        return [...context.eventLog, msg];
      },
    }),
    revealChestCards: assign({
      players: ({ context }) => {
        const winnerId = context.players.find(
          (p) => p.id !== context.lastLoserId
        )?.id;
        if (!winnerId || !context.activeChestId) return context.players;

        const chest = context.chests.find((c) => c.id === context.activeChestId);
        if (!chest) return context.players;

        return context.players.map((p) => {
          if (p.id === winnerId) {
            return {
              ...p,
              inventory: {
                ...p.inventory,
                hand: [...p.inventory.hand, ...chest.cards],
              },
            };
          }
          return p;
        });
      },
      chests: ({ context }) => {
        if (!context.activeChestId) return context.chests;
        return context.chests.map((c) => {
          if (c.id === context.activeChestId) {
            return { ...c, isOpened: true, cards: [] };
          }
          return c;
        });
      },
      globalTimer: ({ context }) => {
        const chest = context.chests.find((c) => c.id === context.activeChestId);
        if (!chest || !chest.timerCard) return context.globalTimer;
        return context.globalTimer + chest.timerCard.timerModifier;
      },
      eventLog: ({ context }) => {
        const winner = context.players.find((p) => p.id !== context.lastLoserId);
        const chest = context.chests.find((c) => c.id === context.activeChestId);
        const logs = [...context.eventLog];
        if (winner && context.activeChestId) {
          logs.push(`${winner.name} забирает содержимое сундука!`);
        }
        if (chest && chest.timerCard) {
          logs.push(`Гнев Дворца усиливается: ${chest.timerCard.name}`);
        }
        return logs;
      },
    }),
    equipItem: assign({
      players: ({ context, event }) => {
        if (event.type !== "EQUIP_ITEM") return context.players;
        return context.players.map((p) => {
          if (p.id !== event.playerId) return p;
          const cardIndex = p.inventory.hand.findIndex(
            (c) => c.id === event.cardId
          );
          if (cardIndex === -1) return p;
          const card = p.inventory.hand[cardIndex];
          if (card.type !== CardType.TREASURE) return p;

          if (p.inventory.equipment.length >= GAME_CONSTANTS.MAX_EQUIPMENT_SIZE)
            return p;

          const newHand = [...p.inventory.hand];
          newHand.splice(cardIndex, 1);

          return {
            ...p,
            inventory: {
              hand: newHand,
              equipment: [
                ...p.inventory.equipment,
                { ...card, isEquipped: true },
              ],
            },
          };
        });
      },
    }),
    useConsumable: assign({
      players: ({ context, event }) => {
        if (event.type !== "USE_CONSUMABLE") return context.players;
        return context.players.map((p) => {
          if (p.id !== event.playerId) return p;
          const cardIndex = p.inventory.hand.findIndex(
            (c) => c.id === event.cardId
          );
          if (cardIndex === -1) return p;
          const card = p.inventory.hand[cardIndex];
          if (card.type !== CardType.CONSUMABLE) return p;

          const newHand = [...p.inventory.hand];
          newHand.splice(cardIndex, 1);

          let newHealth = p.currentHealth;
          let newGold = p.gold;
          const maxHealth =
            p.character?.maxHealth || GAME_CONSTANTS.INITIAL_PLAYER_HEALTH;

          if (card.effectType === "HEAL") {
            newHealth = Math.min(maxHealth, newHealth + card.value);
          } else if (card.effectType === "GOLD_BOOST") {
            newGold += card.value;
          }
          // STRENGTH_BUFF handled during battle if needed, or permanently if defined so
          // Here we follow the simple implementation

          return {
            ...p,
            currentHealth: newHealth,
            gold: newGold,
            inventory: { ...p.inventory, hand: newHand },
          };
        });
      },
    }),
    unequipItem: assign({
      players: ({ context, event }) => {
        if (event.type !== "UNEQUIP_ITEM") return context.players;
        return context.players.map((p) => {
          if (p.id !== event.playerId) return p;
          const cardIndex = p.inventory.equipment.findIndex(
            (c) => c.id === event.cardId
          );
          if (cardIndex === -1) return p;
          const card = p.inventory.equipment[cardIndex];
          if (p.inventory.hand.length >= GAME_CONSTANTS.MAX_HAND_SIZE) return p;

          const newEquipment = [...p.inventory.equipment];
          newEquipment.splice(cardIndex, 1);

          return {
            ...p,
            inventory: {
              ...p.inventory,
              equipment: newEquipment,
              hand: [...p.inventory.hand, { ...card, isEquipped: false }],
            },
          };
        });
      },
    }),
    discardItem: assign({
      players: ({ context, event }) => {
        if (event.type !== "DISCARD_ITEM") return context.players;
        return context.players.map((p) => {
          if (p.id !== event.playerId) return p;
          const inHand = p.inventory.hand.filter((c) => c.id !== event.cardId);
          const inEquip = p.inventory.equipment.filter(
            (c) => c.id !== event.cardId
          );
          return {
            ...p,
            inventory: {
              hand: inHand,
              equipment: inEquip,
            },
          };
        });
      },
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
