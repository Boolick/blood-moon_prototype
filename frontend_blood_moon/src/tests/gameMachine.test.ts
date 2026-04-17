import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { gameMachine } from '../machines/gameMachine';
import { Player, GameState } from '../entities/types';

describe('Game Machine Integration', () => {
  it('should transition through standard phases using sync state', () => {
    const actor = createActor(gameMachine).start();
    
    // Initial state
    expect(actor.getSnapshot().value).toBe('lobby');
    
    // Test that the frontend machine correctly relies on SYNC_STATE
    const nextState: GameState = {
      players: [],
      chests: [],
      globalTimer: 10,
      roundNumber: 1,
      eventLog: [],
      activeChestId: null,
      lastLoserId: null,
      phase: 'chest_selection'
    };

    actor.send({ type: 'SYNC_STATE', state: nextState });
    
    expect(actor.getSnapshot().value).toBe('chest_selection');
    expect(actor.getSnapshot().context.phase).toBe('chest_selection');
  });

  it('should transition to game_over when synced state is game_over', () => {
    const actor = createActor(gameMachine).start();
    
    const gameOverState: GameState = {
      players: [],
      chests: [],
      globalTimer: 0,
      roundNumber: 1,
      eventLog: [],
      activeChestId: null,
      lastLoserId: null,
      phase: 'game_over'
    };

    actor.send({ type: 'SYNC_STATE', state: gameOverState });
    
    expect(actor.getSnapshot().value).toBe('game_over');
  });

  it('should go to syncing state when doing an intent action', () => {
    const actor = createActor(gameMachine).start();

    // Set to rest_phase
    const restState: GameState = {
      players: [{
          id: 'p1', 
          inventory: { hand: [1, 2, 3] as any, equipment: [] }
        } as unknown as Player],
      chests: [],
      globalTimer: 10,
      roundNumber: 1,
      eventLog: [],
      activeChestId: null,
      lastLoserId: null,
      phase: 'rest_phase'
    };

    actor.send({ type: 'SYNC_STATE', state: restState });
    expect(actor.getSnapshot().value).toBe('rest_phase');
    
    // Should successfully transition to syncing
    actor.send({ type: 'END_ROUND' });
    expect(actor.getSnapshot().value).toBe('syncing');
  });
});
