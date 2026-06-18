import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsScreen } from '@/presentation/screens/SettingsScreen';
import '@/framework/i18n/i18n';

describe('SettingsScreen', () => {
  const defaultSettings = { language: 'en' as const, muted: false };

  it('should_render_settings_title', () => {
    const { getByText } = render(
      <SettingsScreen settings={defaultSettings} onLanguageChange={jest.fn()} onMuteChange={jest.fn()} />,
    );
    expect(getByText('Settings')).toBeTruthy();
  });

  it('should_display_english_language_label_when_language_is_en', () => {
    const { getByTestId } = render(
      <SettingsScreen settings={defaultSettings} onLanguageChange={jest.fn()} onMuteChange={jest.fn()} />,
    );
    expect(getByTestId('language-value').props.children).toBe('English');
  });

  it('should_call_onLanguageChange_when_language_is_tapped', () => {
    const onLanguageChange = jest.fn();
    const { getByTestId } = render(
      <SettingsScreen settings={defaultSettings} onLanguageChange={onLanguageChange} onMuteChange={jest.fn()} />,
    );
    fireEvent.press(getByTestId('language-value'));
    expect(onLanguageChange).toHaveBeenCalledWith('es');
  });

  it('should_call_onMuteChange_when_switch_is_toggled', () => {
    const onMuteChange = jest.fn();
    const { getByTestId } = render(
      <SettingsScreen settings={defaultSettings} onLanguageChange={jest.fn()} onMuteChange={onMuteChange} />,
    );
    fireEvent(getByTestId('mute-toggle'), 'valueChange', false);
    expect(onMuteChange).toHaveBeenCalledWith(true);
  });

  it('should_show_spanish_labels_when_language_is_es', () => {
    const { getByText } = render(
      <SettingsScreen settings={{ language: 'es', muted: false }} onLanguageChange={jest.fn()} onMuteChange={jest.fn()} />,
    );
    expect(getByText('Ajustes')).toBeTruthy();
  });
});
