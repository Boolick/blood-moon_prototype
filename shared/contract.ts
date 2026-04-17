/**
 * @license
 * Shared Contract for Frontend <-> Backend interaction.
 * Это чистый TypeScript-манифест данных и событий (Intent) для игры "Кровавая Луна" (в коде "Дворец Атлантиды").
 */

export type CardId = string;
export type PlayerId = string;

// --- CARD TYPES ---
export enum CardType {
  CHARACTER = 'CHARACTER',
  TREASURE = 'TREASURE',
  CONSUMABLE = 'CONSUMABLE',
  OBJECTIVE = 'OBJECTIVE',
  TIMER = 'TIMER',
}

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
  uniqueEffectId: string; // Спец-способность персонажа
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
}

export interface TimerCard extends BaseCard {
  type: CardType.TIMER;
  timerModifier: number; // Отнимание времени (Гнев Дворца), например -1 или -2
}

export type GameCard =
  | CharacterCard
  | TreasureCard
  | ConsumableCard
  | ObjectiveCard
  | TimerCard;

// --- STATE ENTITIES ---
export interface Inventory {
  hand: GameCard[];        // Максимально карт на руке (определяется константой)
  equipment: TreasureCard[]; // Максимально экипированных (определяется константой)
}

export interface Player {
  id: PlayerId;
  name: string;
  character?: CharacterCard;
  currentHealth: number;
  gold: number;
  inventory: Inventory;
  objectives: ObjectiveCard[];
  isAlive: boolean;
  // Дополнительно: флаг готовности к следующей фазе
  isReady?: boolean; 
}

export interface Chest {
  id: string;
  cards: GameCard[]; // Содержимое - сокровища и зелья
  timerCard: TimerCard | null; // Карта гнева
  isOpened: boolean;
}

// --- Survival Resource ---
export interface SurvivalResource {
  total: number;
  breakdown: {
    health: number;
    strength: number;
    gold: number;
  };
}

// --- GLOBAL GAME STATE EXPECTED BY FRONTEND ---
export type GamePhase = 
  | 'lobby' 
  | 'chest_selection' 
  | 'battle_phase' 
  | 'chest_reveal' 
  | 'rest_phase' 
  | 'game_over';

export interface GameState {
  players: Player[];
  chests: Chest[];
  globalTimer: number;       // Гнев Дворца
  roundNumber: number;
  eventLog: string[];
  activeChestId: string | null; 
  lastLoserId: PlayerId | null;
  phase: GamePhase;          // Текущий статус стейт-машины сервера
}

// --- INTENTS (GAME EVENTS) ---
// Эти события клиент отправляет на бекенд, чтобы выразить свое намерение
export type GameIntent =
  // Базовый флоу
  | { type: 'START_GAME' }
  | { type: 'NEXT_PHASE' } // Подтверждение окончания просмотра фазы / переход дальше
  | { type: 'END_ROUND' }  // Завершение хода игроком в фазе отдыха
  | { type: 'RESTART_GAME' }

  // Действия в фазе выбора сундука
  | { type: 'SELECT_CHEST'; playerId: PlayerId; chestId: string }

  // Действия с инвентарем (доступны в фазе отдыха)
  | { type: 'EQUIP_ITEM'; playerId: PlayerId; cardId: CardId }
  | { type: 'UNEQUIP_ITEM'; playerId: PlayerId; cardId: CardId }
  | { type: 'DISCARD_ITEM'; playerId: PlayerId; cardId: CardId }
  | { type: 'USE_CONSUMABLE'; playerId: PlayerId; cardId: CardId }

  // Расширенные действия для битв (на будущее или если требуется)
  | { type: 'SUMMON_ALLY'; playerId: PlayerId; targetPlayerId: PlayerId; cardId: CardId };

// --- CONSTANTS ---
export const GAME_CONSTANTS = {
  // Начальные характеристики
  INITIAL_GLOBAL_TIMER: 10,
  INITIAL_PLAYER_HEALTH: 10,
  INITIAL_PLAYER_GOLD: 0,
  
  // Лимиты инвентаря
  MAX_HAND_SIZE: 3,
  MAX_EQUIPMENT_SIZE: 2,

  // Характеристики поединка
  BASE_CHARACTER_STRENGTH: 5,
};
