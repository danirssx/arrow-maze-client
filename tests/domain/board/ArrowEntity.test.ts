import { ArrowEntity } from "@/domain/board/ArrowEntity";
import { ArrowSpec } from "@/domain/value-objects/ArrowSpec";
import { Direction } from "@/domain/value-objects/Direction";
import { Position } from "@/domain/value-objects/Position";

const spec = (): ArrowSpec =>
  ArrowSpec.of("a", "blue", [Position.of(0, 0), Position.of(0, 1)], Direction.Right);

describe("ArrowEntity", () => {
  it("should_start_active_when_created", () => {
    const arrow = new ArrowEntity(spec());

    expect(arrow.isActive).toBe(true);
    expect(arrow.id).toBe("a");
    expect(arrow.head.equals(Position.of(0, 1))).toBe(true);
  });

  it("should_become_extracted_when_extracted", () => {
    const arrow = new ArrowEntity(spec());

    arrow.extract();

    expect(arrow.isActive).toBe(false);
    expect(arrow.state).toBe("extracted");
  });

  it("should_return_to_active_when_restored", () => {
    const arrow = new ArrowEntity(spec());

    arrow.extract();
    arrow.restore();

    expect(arrow.isActive).toBe(true);
  });
});
