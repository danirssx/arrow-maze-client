type TapEvent = {
  object: { userData: Record<string, unknown> };
  stopPropagation: () => void;
};

export function handleArrowTap(event: TapEvent, onArrowTap?: (id: string) => void): void {
  const arrowId = event.object.userData["arrowId"];
  if (typeof arrowId === "string" && arrowId.length > 0) {
    event.stopPropagation();
    onArrowTap?.(arrowId);
  }
}
