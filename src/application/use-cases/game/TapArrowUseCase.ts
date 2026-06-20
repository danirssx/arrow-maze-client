import { ExtractArrowCommand } from "../../../domain/command/ExtractArrowCommand";
import type { GameSnapshotDto } from "./GameSnapshotDto";
import type { GameSession } from "./GameSession";
import { mapGameSnapshot } from "./GameSnapshotMapper";

/**
 * Tap an arrow by id.
 *
 * The UI/ViewModel resolves the tapped coordinate to an arrow id (it knows the
 * rendered geometry and disambiguates overlaps). If the arrow's ray is clear, the
 * extraction runs through a reversible `ExtractArrowCommand` (recorded for undo);
 * otherwise it is a failed tap that consumes an attempt under the dedup rule.
 */
export class TapArrowUseCase {
  execute(session: GameSession, arrowId: string): GameSnapshotDto {
    const context = session.requireContext();

    if (context.requireLevel().canExtract(arrowId)) {
      session.requireHistory().execute(new ExtractArrowCommand(context, arrowId));
    } else {
      context.failAttempt(arrowId);
    }

    return mapGameSnapshot(session);
  }
}
