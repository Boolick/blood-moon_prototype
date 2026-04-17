import { setup, ActionFunction, AnyActorLogic } from "xstate";
import { GameState, GameIntent } from "@shared/contract";
import * as actions from "./actions/index.js";
import { guards } from "./guards/index.js";

// Make the typings less strict for the setup
export const gameMachineSetup = setup({
  types: {} as {
    context: Omit<GameState, "phase">,
    events: GameIntent
  },
  guards,
  actions: {
    ...actions,
  } as any,
});
