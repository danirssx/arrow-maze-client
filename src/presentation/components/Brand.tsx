import { Image, Text, View } from "react-native";

import logoGo from "../../../assets/images/logo-go.png";

interface BrandProps {
  size?: "md" | "lg";
}

const LOGO_ASPECT = 768 / 614; // intrinsic ratio of assets/images/logo-go.png

/**
 * FlechaGo brand lockup — logo mark above the wordmark.
 *
 * Pure presentation. The mark is a bundled raster (the source SVG wraps a PNG and
 * react-native-svg is not wired); the wordmark keeps the palette tokens.
 */
export function Brand({ size = "lg" }: BrandProps) {
  const textSize = size === "lg" ? "text-4xl" : "text-2xl";
  const logoWidth = size === "lg" ? 132 : 84;

  return (
    <View className="items-center gap-2" accessibilityRole="header">
      <Image
        source={logoGo}
        accessibilityLabel="FlechaGo"
        resizeMode="contain"
        style={{ width: logoWidth, height: logoWidth / LOGO_ASPECT }}
      />
      <View className="flex-row items-center">
        <Text className={`${textSize} font-black text-primary-900`}>Flecha</Text>
        <Text className={`${textSize} font-black text-primary-500`}>Go</Text>
        <Text className={`${textSize} font-black text-primary-300`}> →</Text>
      </View>
    </View>
  );
}
