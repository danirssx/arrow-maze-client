import { useEffect, useMemo } from "react";
import { GameFacade } from "@/application/facades/GameFacade";
import type { LevelDefinition } from "@/application/level-build/LevelDefinition";
import { GameUIController } from "@/presentation/controllers/GameUIController";
import { GameViewModel } from "@/presentation/view-models/GameViewModel";

export type GameSession = {
  readonly viewModel: GameViewModel;
  readonly controller: GameUIController;
};

/**
 * Builds and owns one gameplay MVVM session for a screen.
 *
 * Constructs the `GameFacade`, `GameViewModel`, and `GameUIController` once,
 * attaches the ViewModel to the facade event bridge on mount, starts the level,
 * and disposes the subscription on unmount. The route passes the returned
 * session straight to the `GameScreen`.
 */
export function useGameSession(levelId: string, definition: LevelDefinition | undefined): GameSession {
  const session = useMemo<GameSession>(() => {
    const viewModel = new GameViewModel(GameFacade.createDefault());
    return { viewModel, controller: new GameUIController(viewModel) };
  }, []);

  useEffect(() => {
    session.viewModel.attach();
    if (definition !== undefined) {
      session.viewModel.startLevel(levelId, definition);
    }
    return () => {
      session.viewModel.dispose();
    };
  }, [session, levelId, definition]);

  return session;
}
