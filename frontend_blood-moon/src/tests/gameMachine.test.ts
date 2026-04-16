import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { gameMachine } from '../machines/gameMachine';
import { Player } from '../entities/types';

describe('Game Machine Integration', () => {
  it('should transition through standard phases: lobby -> setup -> round_start -> chest_selection', () => {
    const actor = createActor(gameMachine).start();
    
    // Initial state
    expect(actor.getSnapshot().value).toBe('lobby');
    
    // Start game
    actor.send({ type: 'START_GAME' });
    
    // It should automatically pass through setup and round_start to chest_selection
    expect(actor.getSnapshot().value).toBe('chest_selection');
    expect(actor.getSnapshot().context.roundNumber).toBe(1);
    expect(actor.getSnapshot().context.globalTimer).toBe(10);
  });

  it('should transition to game_over when globalTimer is 0', () => {
    const actor = createActor(gameMachine).start();
    
    // Start game to initialize context
    actor.send({ type: 'START_GAME' });
    
    // Inject test context with globalTimer = 0
    actor.send({ 
      type: 'TEST_SET_CONTEXT', 
      context: { 
        globalTimer: 0, 
        players: [{ id: 'p1', isAlive: true } as Player, { id: 'p2', isAlive: true } as Player] 
      } 
    });
    
    // Move to next phase, which eventually loops back to round_start
    actor.send({ type: 'NEXT_PHASE' }); // -> battle_phase
    actor.send({ type: 'RESOLVE_BATTLES' }); // -> rest_phase
    actor.send({ type: 'END_ROUND' }); // -> round_start -> game_over (due to guard)
    
    expect(actor.getSnapshot().value).toBe('game_over');
  });

  it('should block transition from rest_phase to next round if inventory is invalid', () => {
    const actor = createActor(gameMachine).start();
    actor.send({ type: 'START_GAME' });
    
    // Move to rest_phase
    actor.send({ type: 'NEXT_PHASE' }); // -> battle_phase
    actor.send({ type: 'RESOLVE_BATTLES' }); // -> rest_phase
    
    expect(actor.getSnapshot().value).toBe('rest_phase');
    
    // Inject test context with a player having 4 cards in hand (limit is 3)
    actor.send({ 
      type: 'TEST_SET_CONTEXT', 
      context: { 
        players: [{ 
          id: 'p1', 
          inventory: { hand: [1, 2, 3, 4], equipment: [] } 
        } as unknown as Player] 
      } 
    });
    
    // Try to end round
    actor.send({ type: 'END_ROUND' });
    
    // Should still be in rest_phase because of the guard
    expect(actor.getSnapshot().value).toBe('rest_phase');
    
    // Fix the inventory
    actor.send({ 
      type: 'TEST_SET_CONTEXT', 
      context: { 
        players: [{ 
          id: 'p1', 
          inventory: { hand: [1, 2, 3], equipment: [] } 
        } as unknown as Player] 
      } 
    });
    
    // Try again
    actor.send({ type: 'END_ROUND' });
    
    // Should successfully transition to chest_selection (via round_start)
    expect(actor.getSnapshot().value).toBe('chest_selection');
  });
});
