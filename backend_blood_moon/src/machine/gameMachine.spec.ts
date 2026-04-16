import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { gameMachine } from './gameMachine.js';
import { GAME_CONSTANTS } from '@shared/contract';

describe('Game Machine', () => {
  it('should initialize in lobby phase', () => {
    const actor = createActor(gameMachine).start();
    const state = actor.getSnapshot();
    
    expect(state.value).toBe('lobby');
    expect(state.context.players).toEqual([]);
    expect(state.context.globalTimer).toBe(GAME_CONSTANTS.INITIAL_GLOBAL_TIMER);
    expect(state.context.roundNumber).toBe(1);
  });

  it('should transition from lobby to chest_selection on START_GAME', () => {
    const actor = createActor(gameMachine).start();
    actor.send({ type: 'START_GAME' });
    
    const state = actor.getSnapshot();
    expect(state.value).toBe('chest_selection');
  });

  it('should process NEXT_PHASE correctly', () => {
    const actor = createActor(gameMachine).start();
    
    actor.send({ type: 'START_GAME' });
    expect(actor.getSnapshot().value).toBe('chest_selection');
    
    actor.send({ type: 'NEXT_PHASE' });
    expect(actor.getSnapshot().value).toBe('battle_phase');
    
    actor.send({ type: 'NEXT_PHASE' });
    expect(actor.getSnapshot().value).toBe('chest_reveal');

    actor.send({ type: 'NEXT_PHASE' });
    expect(actor.getSnapshot().value).toBe('rest_phase');
  });

  it('should handle round loop from rest_phase', () => {
    const actor = createActor(gameMachine).start();
    actor.send({ type: 'START_GAME' }); // -> chest_selection
    actor.send({ type: 'NEXT_PHASE' }); // -> battle_phase
    actor.send({ type: 'NEXT_PHASE' }); // -> chest_reveal
    actor.send({ type: 'NEXT_PHASE' }); // -> rest_phase
    
    const preRoundState = actor.getSnapshot();
    expect(preRoundState.context.roundNumber).toBe(1);

    actor.send({ type: 'END_ROUND' }); // -> back to chest_selection and inc round

    const postRoundState = actor.getSnapshot();
    expect(postRoundState.value).toBe('chest_selection');
    expect(postRoundState.context.roundNumber).toBe(2);
  });
});
