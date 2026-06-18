import { useRouter } from "expo-router";

import { DefeatScreen } from "@/presentation/screens/DefeatScreen";

export default function DefeatRoute() {
  const router = useRouter();

  return <DefeatScreen onRetry={() => router.back()} onHome={() => router.dismissAll()} />;
}
