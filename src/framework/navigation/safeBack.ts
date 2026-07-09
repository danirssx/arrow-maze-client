import type { Href, Router } from "expo-router";

type BackRouter = Pick<Router, "back" | "canGoBack" | "replace">;

export function safeBack(router: BackRouter, fallback: Href): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}
