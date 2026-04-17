import { setup } from "xstate";
import { GameState, GameIntent } from "@shared/contract";
import * as actions from "./actions/index.js";
import { guards } from "./guards/index.js";

export const gameMachineSetup = setup({
  types: {
    context: {} as Omit<GameState, "phase">,
    events: {} as GameIntent,
  },
  guards,
  actions: {
    ...actions,
  },
});
