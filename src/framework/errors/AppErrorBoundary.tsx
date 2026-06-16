import type { PropsWithChildren } from "react";
import { Component } from "react";
import { Text, View } from "react-native";

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
        <View>
          <Text>Unexpected application error.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}
