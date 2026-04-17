import { assign } from "xstate";
import { Player } from "@shared/contract";
import { calculateStrength, calculateSurvivalResource } from "@shared/utils";

export const selectChest = assign({
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
});

export const resolveBattleLogic = assign({
  players: ({ context }) => {
    const activePlayers = context.players.filter(p => p.isAlive);
    if (activePlayers.length < 2) return context.players;

    // Сортируем по силе, затем по золоту (tie-breaker)
    const sorted = [...activePlayers].sort((a, b) => {
      const strA = calculateStrength(a);
      const strB = calculateStrength(b);
      if (strA !== strB) return strB - strA;
      return b.gold - a.gold; // Tie-breaker: больше золота = выше место
    });

    const winner = sorted[0];
    const losers = sorted.slice(1);

    return context.players.map((p) => {
      const isLoser = losers.some(l => l.id === p.id);
      if (isLoser) {
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
    const activePlayers = context.players.filter(p => p.isAlive);
    if (activePlayers.length < 2) return null;

    const sorted = [...activePlayers].sort((a, b) => {
      const strA = calculateStrength(a);
      const strB = calculateStrength(b);
      if (strA !== strB) return strB - strA;
      return b.gold - a.gold;
    });

    // Для простоты MVP считаем "последним проигравшим" того, кто занял последнее место в этой битве
    return sorted[sorted.length - 1].id;
  },
  eventLog: ({ context }) => {
    const activePlayers = context.players.filter(p => p.isAlive);
    if (activePlayers.length < 2) return context.eventLog;

    const sorted = [...activePlayers].sort((a, b) => {
      const strA = calculateStrength(a);
      const strB = calculateStrength(b);
      if (strA !== strB) return strB - strA;
      return b.gold - a.gold;
    });

    const winner = sorted[0];
    const loser = sorted[sorted.length - 1];

    let msg = `${winner.name} побеждает в битве!`;
    if (calculateStrength(winner) === calculateStrength(loser)) {
        msg += ` (Победа по золоту)`;
    }
    
    return [...context.eventLog, msg, `${loser.name} теряет 1 HP.`];
  },
});

export const revealChestCards = assign({
  players: ({ context }) => {
    const winnerId = context.players.find(
      (p) => p.isAlive && p.id !== context.lastLoserId // Simplified winner logic for MVP
    )?.id;
    
    // In a multi-player scenario, we might want to be more specific about who won the chest
    // For now, let's assume the one who didn't lose health (or the top player) wins
    const activePlayers = context.players.filter(p => p.isAlive);
    const sorted = [...activePlayers].sort((a, b) => {
        const strA = calculateStrength(a);
        const strB = calculateStrength(b);
        if (strA !== strB) return strB - strA;
        return b.gold - a.gold;
    });
    const trueWinner = sorted[0];

    if (!trueWinner || !context.activeChestId) return context.players;

    const chest = context.chests.find((c) => c.id === context.activeChestId);
    if (!chest) return context.players;

    return context.players.map((p) => {
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
    const activePlayers = context.players.filter(p => p.isAlive);
    const sorted = [...activePlayers].sort((a, b) => {
        const strA = calculateStrength(a);
        const strB = calculateStrength(b);
        if (strA !== strB) return strB - strA;
        return b.gold - a.gold;
    });
    const winner = sorted[0];

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
});
