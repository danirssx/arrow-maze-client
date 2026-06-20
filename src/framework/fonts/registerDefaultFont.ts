import { cloneElement, type ReactElement } from "react";
import { StyleSheet, Text, TextInput, type StyleProp, type TextStyle } from "react-native";

/** Resolved fontWeight → the Outfit weight file loaded in the root layout. */
const FAMILY_BY_WEIGHT: Readonly<Record<string, string>> = {
  "100": "Outfit_400Regular",
  "200": "Outfit_400Regular",
  "300": "Outfit_400Regular",
  "400": "Outfit_400Regular",
  normal: "Outfit_400Regular",
  "500": "Outfit_500Medium",
  "600": "Outfit_600SemiBold",
  "700": "Outfit_700Bold",
  bold: "Outfit_700Bold",
  "800": "Outfit_900Black",
  "900": "Outfit_900Black"
};

function familyForWeight(weight: TextStyle["fontWeight"]): string {
  return FAMILY_BY_WEIGHT[String(weight ?? "400")] ?? "Outfit_400Regular";
}

type StyledElement = ReactElement<{ style?: StyleProp<TextStyle> }>;
type Renderable = { render?: (...args: never[]) => StyledElement | null };

let applied = false;

/**
 * Make Outfit the app-wide default font.
 *
 * React Native does not inherit `fontFamily`, and NativeWind already feeds every
 * Text its `style` from `className`, so a `defaultProps` default never applies.
 * Instead we wrap the host `render` and inject the matching Outfit weight family
 * *under* the element's own style — an explicit `fontFamily` always wins, while
 * `font-bold`/`font-semibold`/`font-black` (which only set `fontWeight`) resolve
 * to the real Outfit weight files instead of a synthetic bold. Idempotent.
 */
export function registerDefaultFont(): void {
  if (applied) return;
  applied = true;
  for (const component of [Text, TextInput]) {
    const target = component as unknown as Renderable;
    const original = target.render;
    if (typeof original !== "function") continue;
    target.render = (...args: never[]): StyledElement | null => {
      const element = original(...args);
      if (element === null) return element;
      const flattened = (StyleSheet.flatten(element.props.style) ?? {}) as TextStyle;
      if (flattened.fontFamily !== undefined) return element;
      return cloneElement(element, {
        style: [{ fontFamily: familyForWeight(flattened.fontWeight) }, element.props.style]
      });
    };
  }
}
