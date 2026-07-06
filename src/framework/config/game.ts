import { TimeScoringStrategy } from '@/domain/scoring/TimeScoringStrategy';
import { GameFacade } from '@/application/facades/GameFacade';
import { ConcreteLevelBuilder } from '@/application/level-build/ConcreteLevelBuilder';
import { LevelDirector } from '@/application/level-build/LevelDirector';
import { GameSession } from '@/application/use-cases/game/GameSession';
import { PauseGameUseCase } from '@/application/use-cases/game/PauseGameUseCase';
import { ResolveLevelOutcomeUseCase } from '@/application/use-cases/game/ResolveLevelOutcomeUseCase';
import { ResumeGameUseCase } from '@/application/use-cases/game/ResumeGameUseCase';
import { StartLevelUseCase } from '@/application/use-cases/game/StartLevelUseCase';
import { TapArrowUseCase } from '@/application/use-cases/game/TapArrowUseCase';
import { UndoLastMoveUseCase } from '@/application/use-cases/game/UndoLastMoveUseCase';
import { GameUIController } from '@/presentation/controllers/GameUIController';
import { GameViewModel } from '@/presentation/view-models/GameViewModel';

export type ComposedGameSession = {
  readonly facade: GameFacade;
  readonly viewModel: GameViewModel;
  readonly controller: GameUIController;
};

export function createGameFacade(): GameFacade {
  return new GameFacade({
    session: new GameSession(),
    startLevel: new StartLevelUseCase(new LevelDirector(new ConcreteLevelBuilder())),
    tapArrow: new TapArrowUseCase(),
    undoLastMove: new UndoLastMoveUseCase(),
    pauseGame: new PauseGameUseCase(),
    resumeGame: new ResumeGameUseCase(),
    resolveOutcome: new ResolveLevelOutcomeUseCase(new TimeScoringStrategy()),
  });
}

export function createGameSession(): ComposedGameSession {
  const facade = createGameFacade();
  const viewModel = new GameViewModel(facade);
  return { facade, viewModel, controller: new GameUIController(viewModel) };
}
