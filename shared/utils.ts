import { Player, SurvivalResource, ObjectiveType } from './contract.js';

/**
 * Рассчитывает Ресурс Выживания для игрока.
 * Ресурс Выживания = Текущие Жизни + Сила (базовая + от предметов) + Золото
 */
export function calculateSurvivalResource(player: Player): SurvivalResource {
  const health = player.currentHealth;
  const gold = player.gold;
  
  // Базовая сила от персонажа + бонусы от экипированных предметов
  const baseStrength = player.character?.baseStrength ?? 5; // Default 5
  const equipmentStrength = player.inventory.equipment.reduce(
    (acc, item) => acc + item.strengthBonus, 
    0
  );
  
  const totalStrength = baseStrength + equipmentStrength;
  
  return {
    total: health + totalStrength + gold,
    breakdown: {
      health,
      strength: totalStrength,
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
