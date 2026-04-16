import { Player, SurvivalResource, ObjectiveType } from './types';

/**
 * Рассчитывает Ресурс Выживания для игрока.
 * Ресурс Выживания = Текущие Жизни + Сила (базовая + от предметов) + Золото
 */
export function calculateSurvivalResource(player: Player): SurvivalResource {
  const health = player.currentHealth;
  const gold = player.gold;
  
  // Базовая сила от персонажа + бонусы от экипированных предметов
  const baseStrength = player.character?.baseStrength ?? 0;
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

/**
 * Определяет победителя в битве.
 * Сначала сравнивается общая сила (Лидер + Союзники).
 * При ничьей побеждает Лидер с наибольшим Ресурсом Выживания.
 */
export function resolveBattle(participants: { player: Player, totalStrength: number }[]): Player | null {
  if (participants.length === 0) return null;
  if (participants.length === 1) return participants[0].player;

  // Сортируем по силе по убыванию
  const sortedByStrength = [...participants].sort((a, b) => b.totalStrength - a.totalStrength);
  const highestStrength = sortedByStrength[0].totalStrength;
  
  const tiedLeaders = sortedByStrength.filter(p => p.totalStrength === highestStrength);
  
  if (tiedLeaders.length === 1) {
    return tiedLeaders[0].player;
  }
  
  // Ничья: побеждает тот, у кого выше Ресурс Выживания
  const sortedBySurvival = tiedLeaders.sort((a, b) => {
    return calculateSurvivalResource(b.player).total - calculateSurvivalResource(a.player).total;
  });
  
  return sortedBySurvival[0].player;
}
