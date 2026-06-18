import type { GameEventDto } from "./GameEventDto";

/**
 * Observer bridge / MVVM boundary — presentation-facing listener contract.
 *
 * A future `GameViewModel` (presentation layer) implements this interface to
 * receive UI-neutral game events. It is the only thing presentation needs in
 * order to observe the domain.
 *
 * GameViewModel responsibilities (documented here so AM-045 can be coordinated
 * with the presentation owner before screens are built):
 *
 * - Subscribe via `GameFacade.addEventListener(this)` and unsubscribe on teardown.
 * - Translate each `GameEventDto` into observable UI state (e.g. show victory or
 *   defeat on `LEVEL_FINISHED`, animate movement on `MOVE_EXECUTED`).
 * - Drive gameplay only through the `GameFacade` (`startLevel`, `tapArrow`,
 *   `undo`, `pauseGame`, `resumeGame`) and read the layout through
 *   `BoardSnapshotDto` / `GameSnapshotDto`.
 *
 * GameViewModel must NOT:
 *
 * - Import `BoardGraph`, `BoardGroup`, `BaseLevel`/`NormalLevel`/`TimedLevel`, or
 *   any other concrete domain class.
 * - Import domain value objects such as `Position` or `LevelResult`; it uses the
 *   `*Dto` types instead.
 * - Contain game rules; all rules stay in the domain behind the facade.
 */
export interface IGameEventListener {
  onGameEvent(event: GameEventDto): void;
}
