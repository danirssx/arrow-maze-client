import { createGameFacade, createGameSession } from '@/framework/config/game';
import { TutorialLevelStrategy } from '@/application/level-build/TutorialLevelStrategy';
import { GamePhase } from '@/domain/state/GamePhase';

describe('createGameFacade', () => {
  it('should_produce_a_working_facade_that_can_start_a_level', () => {
    const facade = createGameFacade();
    const snapshot = facade.startLevel(new TutorialLevelStrategy());
    expect(snapshot.phase).toBe(GamePhase.Playing);
    expect(snapshot.arrowsRemaining).toBe(2);
  });
});

describe('createGameSession', () => {
  it('should_wire_facade_viewModel_and_controller_together', () => {
    const { facade, viewModel, controller } = createGameSession();
    expect(facade).toBeDefined();
    expect(viewModel).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should_produce_independent_sessions_on_each_call', () => {
    const a = createGameSession();
    const b = createGameSession();
    expect(a.facade).not.toBe(b.facade);
    expect(a.viewModel).not.toBe(b.viewModel);
  });
});
