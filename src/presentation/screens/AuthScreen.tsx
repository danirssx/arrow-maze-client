import { useEffect } from "react";
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
 * Purely renders `AuthUiState` and dispatches intents to `AuthViewModel`.
 * No local useState — mode, fields, and async status live in the ViewModel.
 */
export function AuthScreen({ viewModel, onBack, onAuthenticated }: AuthScreenProps) {
  const { t } = useTranslation();
  const state = useViewModelState(viewModel);

  useEffect(() => {
    if (state.session !== null) {
      onAuthenticated?.();
    }
  }, [state.session, onAuthenticated]);

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

  return (
    <ScreenContainer testID="auth-screen">
      <Header title={t("auth.title")} onBack={onBack} />
      <View className="mt-4 gap-3">
        {state.isRegister ? (
          <TextInput
            testID="auth-username-input"
            placeholder={t("auth.username")}
            autoCapitalize="none"
            value={state.username}
            onChangeText={(v) => viewModel.setUsername(v)}
            className={FIELD_CLASS}
          />
        ) : null}
        <TextInput
          testID="auth-email"
          placeholder={t("auth.email")}
          autoCapitalize="none"
          keyboardType="email-address"
          value={state.email}
          onChangeText={(v) => viewModel.setEmail(v)}
          className={FIELD_CLASS}
        />
        <TextInput
          testID="auth-password"
          placeholder={t("auth.password")}
          secureTextEntry
          value={state.password}
          onChangeText={(v) => viewModel.setPassword(v)}
          className={FIELD_CLASS}
        />
        {state.errorKey !== null ? (
          <Text testID="auth-error" className="text-sm font-semibold text-reward-orange">
            {t(state.errorKey)}
          </Text>
        ) : null}
        <PrimaryButton
          testID="auth-submit"
          label={state.isRegister ? t("auth.register") : t("auth.login")}
          onPress={() => void viewModel.submit()}
          disabled={loading}
        />
        <PrimaryButton
          testID="auth-toggle"
          label={state.isRegister ? t("auth.haveAccount") : t("auth.needAccount")}
          variant="secondary"
          onPress={() => viewModel.toggleMode()}
        />
      </View>
    </ScreenContainer>
  );
}
