import { assign } from "xstate";
import { CardType, GAME_CONSTANTS } from "@shared/contract";

export const equipItem = assign({
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
});

export const unequipItem = assign({
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
});

export const discardItem = assign({
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
});

export const useConsumable = assign({
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

      return {
        ...p,
        currentHealth: newHealth,
        gold: newGold,
        inventory: { ...p.inventory, hand: newHand },
      };
    });
  },
});
