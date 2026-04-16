/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CardId = string;
export type PlayerId = string;

export enum CardType {
  CHARACTER = 'CHARACTER',
  TREASURE = 'TREASURE',
  CONSUMABLE = 'CONSUMABLE',
  OBJECTIVE = 'OBJECTIVE',
  TIMER = 'TIMER',
}

// --- Cards (Discriminated Unions) ---

export interface BaseCard {
  id: CardId;
  name: string;
  description: string;
  type: CardType;
  imageUrl?: string;
}

export interface CharacterCard extends BaseCard {
  type: CardType.CHARACTER;
  baseStrength: number;
  maxHealth: number;
  uniqueEffectId: string;
}

export interface TreasureCard extends BaseCard {
  type: CardType.TREASURE;
  strengthBonus: number;
  goldValue: number;
  isEquipped: boolean;
  passiveEffectId?: string;
  onDiscardEffectId?: string;
}

export interface ConsumableCard extends BaseCard {
  type: CardType.CONSUMABLE;
  effectType: 'HEAL' | 'STRENGTH_BUFF' | 'GOLD_BOOST';
  value: number;
}

export enum ObjectiveType {
  FRIEND = 'FRIEND',
  ENEMY = 'ENEMY',
}

export interface ObjectiveCard extends BaseCard {
  type: CardType.OBJECTIVE;
  objectiveType: ObjectiveType;
  targetPlayerId?: string;
  // In a real game, this might be a reference to a player or a condition
}

export interface TimerCard extends BaseCard {
  type: CardType.TIMER;
  timerModifier: number; // e.g., -1 or -2
}

export type GameCard = 
  | CharacterCard 
  | TreasureCard 
  | ConsumableCard 
  | ObjectiveCard 
  | TimerCard;

// --- Player and Inventory ---

export interface Inventory {
  hand: GameCard[]; // Max 3 (excluding objectives)
  equipment: TreasureCard[]; // Max 2
}

export interface Player {
  id: PlayerId;
  name: string;
  character?: CharacterCard;
  currentHealth: number;
  gold: number;
  inventory: Inventory;
  objectives: ObjectiveCard[]; // Friend and Enemy
  isAlive: boolean;
}

// --- Battle System ---

export enum BattleRole {
  LEADER = 'LEADER',
  ALLY = 'ALLY',
  OBSERVER = 'OBSERVER',
}

export interface BattleParticipant {
  playerId: PlayerId;
  role: BattleRole;
  contributedStrength: number;
}

// --- Survival Resource ---

/**
 * Survival Resource = Current Health + Strength (base + items) + Gold
 */
export interface SurvivalResource {
  total: number;
  breakdown: {
    health: number;
    strength: number;
    gold: number;
  };
}

// --- Game State (Global Context) ---

export interface GameStateContext {
  players: Player[];
  activePlayerId: PlayerId;
  globalTimer: number; // Wrath of the Palace (starts at 10)
  roundNumber: number;
  chests: Chest[];
}

export interface Chest {
  id: string;
  cards: GameCard[]; // Treasures + Consumables
  timerCard: TimerCard;
  isOpened: boolean;
}
