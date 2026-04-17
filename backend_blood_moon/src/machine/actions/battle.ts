import { assign } from "xstate";
import { Player, Chest } from "@shared/contract";
import { calculateStrength, resolveBattle } from "../../../../shared/utils.js";

export const selectChest = assign({
  activeChestId: ({ context, event }: any) => {
    if (event.type !== "SELECT_CHEST") return context.activeChestId;
    const chest = context.chests.find((c: Chest) => c.id === event.chestId);
    if (chest && chest.isOpened) return context.activeChestId;
    return event.chestId;
  },
  eventLog: ({ context, event }: any) => {
    if (event.type !== "SELECT_CHEST") return context.eventLog;
    return [
      ...context.eventLog,
      `Игрок ${event.playerId} выбрал сундук ${event.chestId}`,
    ];
  },
});

export const resolveBattleLogic = assign({
  players: ({ context }: any) => {
    const activePlayers = context.players.filter((p: Player) => p.isAlive);
    if (activePlayers.length < 2) return context.players;

    const participants = activePlayers.map((p: Player) => ({
      player: p,
      totalStrength: calculateStrength(p),
    }));

    const winner = resolveBattle(participants);

    return context.players.map((p: Player) => {
      // Any active player who is not the winner loses health
      if (p.isAlive && winner && p.id !== winner.id) {
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
  lastLoserId: ({ context }: any) => {
    const activePlayers = context.players.filter((p: Player) => p.isAlive);
    if (activePlayers.length < 2) return null;

    // Use the same tie-breaker logic as resolveBattle to find the loser
    const participants = activePlayers.map((p: Player) => ({
      player: p,
      totalStrength: calculateStrength(p),
    }));

    const sorted = [...participants].sort((a, b) => {
      if (b.totalStrength !== a.totalStrength) {
        return b.totalStrength - a.totalStrength;
      }
      return b.player.gold - a.player.gold;
    });

    // The loser is the last one in the sorted list
    return sorted[sorted.length - 1].player.id;
  },
  eventLog: ({ context }: any) => {
    const activePlayers = context.players.filter((p: Player) => p.isAlive);
    if (activePlayers.length < 2) return context.eventLog;

    const participants = activePlayers.map((p: Player) => ({
      player: p,
      totalStrength: calculateStrength(p),
    }));

    const sorted = [...participants].sort((a, b) => {
      if (b.totalStrength !== a.totalStrength) {
        return b.totalStrength - a.totalStrength;
      }
      return b.player.gold - a.player.gold;
    });

    const winner = sorted[0].player;
    const loser = sorted[sorted.length - 1].player;

    let msg = `${winner.name} побеждает в битве!`;
    if (calculateStrength(winner) === calculateStrength(loser)) {
        msg += ` (Победа по золоту)`;
    }
    
    return [...context.eventLog, msg, `${loser.name} теряет 1 HP.`];
  },
});

export const revealChestCards = assign({
  players: ({ context }: any) => {
    const activePlayers = context.players.filter((p: Player) => p.isAlive);
    const participants = activePlayers.map((p: Player) => ({
      player: p,
      totalStrength: calculateStrength(p),
    }));
    const trueWinner = resolveBattle(participants);

    if (!trueWinner || !context.activeChestId) return context.players;

    const chest = context.chests.find((c: Chest) => c.id === context.activeChestId);
    if (!chest) return context.players;

    return context.players.map((p: Player) => {
      if (p.id === trueWinner.id) {
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
  chests: ({ context }: any) => {
    if (!context.activeChestId) return context.chests;
    return context.chests.map((c: Chest) => {
      if (c.id === context.activeChestId) {
        return { ...c, isOpened: true, cards: [] };
      }
      return c;
    });
  },
  globalTimer: ({ context }: any) => {
    const chest = context.chests.find((c: Chest) => c.id === context.activeChestId);
    if (!chest || !chest.timerCard) return context.globalTimer;
    return context.globalTimer + chest.timerCard.timerModifier;
  },
  eventLog: ({ context }: any) => {
    const activePlayers = context.players.filter((p: Player) => p.isAlive);
    const participants = activePlayers.map((p: Player) => ({
      player: p,
      totalStrength: calculateStrength(p),
    }));
    const winner = resolveBattle(participants);

    const chest = context.chests.find((c: Chest) => c.id === context.activeChestId);
    const logs = [...context.eventLog];
    if (winner && context.activeChestId) {
      logs.push(`${winner.name} забирает содержимое сундука!`);
    }
    if (chest && chest.timerCard) {
      logs.push(`Гнев Дворца усиливается: ${chest.timerCard.name}`);
    }
    return logs;
  },
});
