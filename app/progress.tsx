import { useMemo } from "react";
import { useRouter } from "expo-router";

import { createProgressViewModel } from "@/framework/config/progress";
import { useCurrentSession } from "@/framework/hooks/useCurrentSession";
import { ProgressScreen } from "@/presentation/screens/ProgressScreen";

export default function ProgressRoute() {
  const router = useRouter();
  const viewModel = useMemo(() => createProgressViewModel(), []);
  const { session } = useCurrentSession();

  return (
    <ProgressScreen
      viewModel={viewModel}
      userId={session?.userId ?? null}
      accessToken={session?.accessToken ?? null}
      onBack={() => router.back()}
    />
  );
}
