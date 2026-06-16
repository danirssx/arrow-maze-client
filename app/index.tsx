import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24
      }}
    >
      <Text>{t("app.title")}</Text>
      <Text>{t("app.setupStatus")}</Text>
    </View>
  );
}
