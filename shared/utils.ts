import { Player, SurvivalResource, ObjectiveType, GAME_CONSTANTS } from './contract.js';

/**
 * Рассчитывает текущую Силу игрока.
 * Сила = Базовая сила персонажа + бонусы от экипированных предметов
 */
export function calculateStrength(player: Player): number {
  const baseStrength = player.character?.baseStrength ?? GAME_CONSTANTS.BASE_CHARACTER_STRENGTH;
  const equipmentStrength = player.inventory.equipment.reduce(
    (acc, item) => acc + (item.strengthBonus || 0), 
    0
  );
  return baseStrength + equipmentStrength;
}

/**
 * Рассчитывает Ресурс Выживания для игрока.
 * Ресурс Выживания = Текущие Жизни + Сила (базовая + от предметов) + Золото
 */
export function calculateSurvivalResource(player: Player): SurvivalResource {
  const health = player.currentHealth;
  const gold = player.gold;
  const strength = calculateStrength(player);
  
  return {
    total: health + strength + gold,
    breakdown: {
      health,
      strength,
      gold,
    }
  };
}

/**
 * Рассчитывает итоговое золото игрока в конце игры.
 * Формула: Личное золото + Золото предметов + (Золото Друга / 2) + (MaxHP Врага - CurrentHP Врага)
 * 
 * @param player Игрок, для которого ведется расчет
 * @param allPlayers Список всех игроков (для поиска Друга и Врага)
 * @returns Итоговое количество золота (победных очков)
 */
export function calculateFinalGold(player: Player, allPlayers: Player[]): number {
  // 1. Личное золото
  const personalGold = player.gold;

  // 2. Золото от экипированных предметов
  const itemsGold = player.inventory.equipment.reduce((acc, item) => acc + item.goldValue, 0);

  // Ищем цели: Друга и Врага
  const friendObjective = player.objectives.find(obj => obj.objectiveType === ObjectiveType.FRIEND);
  const enemyObjective = player.objectives.find(obj => obj.objectiveType === ObjectiveType.ENEMY);

  let friendGoldBonus = 0;
  if (friendObjective) {
    const friend = allPlayers.find(p => p.id === friendObjective.targetPlayerId);
    if (friend) {
      // Половина золота друга (округляем вниз)
      friendGoldBonus = Math.floor(friend.gold / 2);
    }
  }

  let enemyDamageBonus = 0;
  if (enemyObjective) {
    const enemy = allPlayers.find(p => p.id === enemyObjective.targetPlayerId);
    if (enemy && enemy.character) {
      // Разница между максимальным и текущим здоровьем врага
      enemyDamageBonus = Math.max(0, enemy.character.maxHealth - enemy.currentHealth);
    }
  }

  // Итоговая сумма
  return personalGold + itemsGold + friendGoldBonus + enemyDamageBonus;
}

/**
 * Определяет победителя в битве.
 * Сначала сравнивается общая сила.
 * При ничьей побеждает Лидер с наибольшим количеством золота.
 */
export function resolveBattle(participants: { player: Player, totalStrength: number }[]): Player | null {
  if (participants.length === 0) return null;
  if (participants.length === 1) return participants[0].player;

  // Сортируем по силе по убыванию, затем по золоту
  const sorted = [...participants].sort((a, b) => {
    if (b.totalStrength !== a.totalStrength) {
      return b.totalStrength - a.totalStrength;
    }
    return b.player.gold - a.player.gold;
  });
  
  return sorted[0].player;
}
