import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Header } from "@/presentation/components/Header";
import { PrimaryButton } from "@/presentation/components/PrimaryButton";
import { ScreenContainer } from "@/presentation/components/ScreenContainer";
import { useViewModelState } from "@/presentation/hooks/useViewModelState";
import { AsyncStatus } from "@/presentation/state/AsyncUiState";
import type { AuthViewModel } from "@/presentation/view-models/AuthViewModel";

interface AuthScreenProps {
  viewModel: AuthViewModel;
  onBack: () => void;
  onAuthenticated?: (() => void) | undefined;
}

const FIELD_CLASS = "rounded-2xl bg-background-card border border-border-soft p-4 text-text-primary";

/**
 * MVVM view — auth (login / register).
 *
 * When signed in it shows the username + a logout action; otherwise a small
 * login/register form. It only drives `AuthViewModel`; it never calls HTTP,
 * storage, or use cases directly.
 */
export function AuthScreen({ viewModel, onBack, onAuthenticated }: AuthScreenProps) {
  const { t } = useTranslation();
  const state = useViewModelState(viewModel);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (state.session !== null) {
    return (
      <ScreenContainer testID="auth-screen">
        <Header title={t("auth.title")} onBack={onBack} />
        <View className="mt-6 gap-4">
          <Text testID="auth-username" className="text-lg font-black text-text-primary">
            {t("auth.signedInAs", { username: state.session.username })}
          </Text>
          <PrimaryButton
            testID="auth-logout"
            label={t("auth.logout")}
            variant="secondary"
            onPress={() => void viewModel.logout()}
          />
        </View>
      </ScreenContainer>
    );
  }

  const loading = state.status === AsyncStatus.Loading;

  const submit = (): void => {
    const done = (): void => {
      if (viewModel.getState().session !== null) {
        onAuthenticated?.();
      }
    };
    if (mode === "login") {
      void viewModel.login(email.trim(), password).then(done);
    } else {
      void viewModel.register(email.trim(), username.trim(), password).then(done);
    }
  };

  return (
    <ScreenContainer testID="auth-screen">
      <Header title={t("auth.title")} onBack={onBack} />
      <View className="mt-4 gap-3">
        {mode === "register" ? (
          <TextInput
            testID="auth-username-input"
            placeholder={t("auth.username")}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            className={FIELD_CLASS}
          />
        ) : null}
        <TextInput
          testID="auth-email"
          placeholder={t("auth.email")}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          className={FIELD_CLASS}
        />
        <TextInput
          testID="auth-password"
          placeholder={t("auth.password")}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          className={FIELD_CLASS}
        />
        {state.errorKey !== null ? (
          <Text testID="auth-error" className="text-sm font-semibold text-reward-orange">
            {t(state.errorKey)}
          </Text>
        ) : null}
        <PrimaryButton
          testID="auth-submit"
          label={mode === "login" ? t("auth.login") : t("auth.register")}
          onPress={submit}
          disabled={loading}
        />
        <PrimaryButton
          testID="auth-toggle"
          label={mode === "login" ? t("auth.needAccount") : t("auth.haveAccount")}
          variant="secondary"
          onPress={() => setMode(mode === "login" ? "register" : "login")}
        />
      </View>
    </ScreenContainer>
  );
}
