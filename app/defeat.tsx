import { useRouter } from "expo-router";

import { safeBack } from "@/framework/navigation/safeBack";
import { DefeatScreen } from "@/presentation/screens/DefeatScreen";

export default function DefeatRoute() {
  const router = useRouter();

  return <DefeatScreen onRetry={() => safeBack(router, "/levels")} onHome={() => router.dismissAll()} />;
}
