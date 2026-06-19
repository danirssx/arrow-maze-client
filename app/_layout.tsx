import "@/framework/i18n/i18n";
import "../global.css";

import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_900Black
} from "@expo-google-fonts/outfit";

import { registerDefaultFont } from "@/framework/fonts/registerDefaultFont";

// Patch the host Text renderer once so Outfit becomes the default font everywhere.
registerDefaultFont();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black
  });

  // Hold the UI until the fonts are ready so text never flashes in the system font.
  if (!fontsLoaded && fontError === null) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F4F5FF" } }} />
    </SafeAreaProvider>
  );
}
