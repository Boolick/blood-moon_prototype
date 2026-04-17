import { describe, it, expect } from 'vitest';
import { calculateSurvivalResource, calculateFinalGold, resolveBattle } from '@shared/utils';
import { Player, CardType, ObjectiveType, CharacterCard, TreasureCard, ObjectiveCard } from '../entities/types';

const mockCharacter: CharacterCard = {
  id: 'char_1',
  name: 'Hero',
  description: 'A brave hero',
  type: CardType.CHARACTER,
  baseStrength: 5,
  maxHealth: 10,
  uniqueEffectId: 'eff_1',
};

const mockTreasure: TreasureCard = {
  id: 'treas_1',
  name: 'Sword',
  description: 'A sharp sword',
  type: CardType.TREASURE,
  strengthBonus: 3,
  goldValue: 5,
  isEquipped: true,
};

const mockFriend: ObjectiveCard = {
  id: 'obj_1',
  name: 'Friend',
  description: 'Your friend',
  type: CardType.OBJECTIVE,
  objectiveType: ObjectiveType.FRIEND,
  targetPlayerId: 'p2',
};

const mockEnemy: ObjectiveCard = {
  id: 'obj_2',
  name: 'Enemy',
  description: 'Your enemy',
  type: CardType.OBJECTIVE,
  objectiveType: ObjectiveType.ENEMY,
  targetPlayerId: 'p3',
};

const createMockPlayer = (overrides: Partial<Player>): Player => ({
  id: 'p1',
  name: 'Test Player',
  currentHealth: 10,
  gold: 0,
  inventory: { hand: [], equipment: [] },
  objectives: [],
  isAlive: true,
  ...overrides,
});

describe('Utils', () => {
  describe('calculateSurvivalResource', () => {
    it('should calculate correctly for a player with 0 gold and no items', () => {
      const player = createMockPlayer({
        character: mockCharacter,
        currentHealth: 10,
        gold: 0,
      });

      const result = calculateSurvivalResource(player);
      // Health(10) + Strength(5) + Gold(0) = 15
      expect(result.total).toBe(15);
      expect(result.breakdown).toEqual({ health: 10, strength: 5, gold: 0 });
    });

    it('should calculate correctly for a player with max items and gold', () => {
      const player = createMockPlayer({
        character: mockCharacter,
        currentHealth: 8,
        gold: 20,
        inventory: {
          hand: [],
          equipment: [mockTreasure, mockTreasure], // 2 items, +6 strength total
        },
      });

      const result = calculateSurvivalResource(player);
      // Health(8) + Strength(5 + 3 + 3 = 11) + Gold(20) = 39
      expect(result.total).toBe(39);
      expect(result.breakdown).toEqual({ health: 8, strength: 11, gold: 20 });
    });
  });

  describe('calculateFinalGold', () => {
    it('should calculate correctly when Enemy is dead (MaxHP) and Friend is rich', () => {
      const player1 = createMockPlayer({
        id: 'p1',
        gold: 10,
        inventory: { hand: [], equipment: [mockTreasure] }, // +5 gold
        objectives: [mockFriend, mockEnemy],
      });

      const friend = createMockPlayer({
        id: 'p2',
        gold: 15, // Friend's gold / 2 = 7
      });

      const enemy = createMockPlayer({
        id: 'p3',
        character: mockCharacter, // maxHealth: 10
        currentHealth: 0, // Dead, diff is 10
      });

      const result = calculateFinalGold(player1, [player1, friend, enemy]);
      // 10 (personal) + 5 (items) + 7 (friend) + 10 (enemy) = 32
      expect(result).toBe(32);
    });

    it('should calculate correctly when everything is zero', () => {
      const player1 = createMockPlayer({
        id: 'p1',
        gold: 0,
        inventory: { hand: [], equipment: [] },
        objectives: [mockFriend, mockEnemy],
      });

      const friend = createMockPlayer({ id: 'p2', gold: 0 });
      const enemy = createMockPlayer({ id: 'p3', character: mockCharacter, currentHealth: 10 });

      const result = calculateFinalGold(player1, [player1, friend, enemy]);
      expect(result).toBe(0);
    });
  });

  describe('resolveBattle', () => {
    it('should return the leader with the highest strength', () => {
      const p1 = createMockPlayer({ id: 'p1' });
      const p2 = createMockPlayer({ id: 'p2' });

      const winner = resolveBattle([
        { player: p1, totalStrength: 10 },
        { player: p2, totalStrength: 8 },
      ]);

      expect(winner?.id).toBe('p1');
    });

    it('should resolve ties using Gold', () => {
      // p1 has 10 health, 0 gold
      const p1 = createMockPlayer({ id: 'p1', currentHealth: 10, gold: 0 });
      // p2 has 10 health, 5 gold
      const p2 = createMockPlayer({ id: 'p2', currentHealth: 10, gold: 5 });

      const winner = resolveBattle([
        { player: p1, totalStrength: 10 },
        { player: p2, totalStrength: 10 }, // Tie in strength
      ]);

      // p2 should win because of higher Gold
      expect(winner?.id).toBe('p2');
    });
  });
});
