import { GAME_CONSTANTS } from "@shared/contract";

export const guards = {
  isGameOver: ({ context }: any) => {
    const alivePlayers = context.players.filter((p: any) => p.isAlive);
    const allChestsOpened =
      context.chests.length > 0 && context.chests.every((c: any) => c.isOpened);
    return (
      context.globalTimer <= 0 ||
      (context.players.length > 0 && alivePlayers.length <= 1) ||
      allChestsOpened
    );
  },
  isChestSelected: ({ context }: any) => context.activeChestId !== null,
  isInventoryValid: ({ context }: any) => {
    // Проверка лимита карт в руке (макс 3) для всех игроков
    return context.players.every((p: any) => p.inventory.hand.length <= GAME_CONSTANTS.MAX_HAND_SIZE);
  },
};
