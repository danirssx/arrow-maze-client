import type { PropsWithChildren } from "react";
import { Component } from "react";
import { Text, View } from "react-native";
import { i18n } from "@/framework/i18n/i18n";

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-maze-slate">
            {i18n.t("errors.generic")}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
