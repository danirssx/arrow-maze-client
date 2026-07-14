import { handleArrowTap } from "@/presentation/components/board3d/arrowTapHandler";

// Subject to human review — pure tap handler unit tests (MAZ-242)

function makeEvent(arrowId?: unknown): { object: { userData: Record<string, unknown> }; stopPropagation: () => void } {
  return {
    object: { userData: arrowId !== undefined ? { arrowId } : {} },
    stopPropagation: jest.fn(),
  };
}

describe("handleArrowTap", () => {
  it("should_call_onArrowTap_when_mesh_userData_has_arrowId", () => {
    // @s1
    const onArrowTap = jest.fn();
    const event = makeEvent("arrow-1");

    handleArrowTap(event, onArrowTap);

    expect(onArrowTap).toHaveBeenCalledTimes(1);
    expect(onArrowTap).toHaveBeenCalledWith("arrow-1");
  });

  it("should_call_onArrowTap_with_correct_id_for_different_arrow", () => {
    // @s2
    const onArrowTap = jest.fn();
    const event = makeEvent("arrow-2");

    handleArrowTap(event, onArrowTap);

    expect(onArrowTap).toHaveBeenCalledTimes(1);
    expect(onArrowTap).toHaveBeenCalledWith("arrow-2");
  });

  it("should_not_call_onArrowTap_when_mesh_has_no_arrowId", () => {
    // @s3
    const onArrowTap = jest.fn();
    const event = makeEvent();

    handleArrowTap(event, onArrowTap);

    expect(onArrowTap).not.toHaveBeenCalled();
  });

  it("should_not_call_onArrowTap_when_arrowId_is_empty_string", () => {
    // @s3 edge
    const onArrowTap = jest.fn();
    const event = makeEvent("");

    handleArrowTap(event, onArrowTap);

    expect(onArrowTap).not.toHaveBeenCalled();
  });

  it("should_not_throw_when_onArrowTap_is_not_provided", () => {
    // @s5
    const event = makeEvent("arrow-1");

    expect(() => handleArrowTap(event, undefined)).not.toThrow();
  });

  it("should_call_stopPropagation_when_arrowId_is_found", () => {
    const onArrowTap = jest.fn();
    const event = makeEvent("arrow-1");

    handleArrowTap(event, onArrowTap);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it("should_not_call_stopPropagation_when_no_arrowId", () => {
    const onArrowTap = jest.fn();
    const event = makeEvent();

    handleArrowTap(event, onArrowTap);

    expect(event.stopPropagation).not.toHaveBeenCalled();
  });
});
