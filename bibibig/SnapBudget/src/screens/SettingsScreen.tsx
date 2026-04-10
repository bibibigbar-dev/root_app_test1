import React from 'react';
import {Text, View} from 'react-native';
import {PickerRow} from '../components/PickerRow';
import {styles} from '../styles/appStyles';

type Props = {
  appLanguage: 'English' | 'Korean';
  appCurrency: 'USD' | 'KRW' | 'EUR';
  onSelectLanguage: (value: 'English' | 'Korean') => void;
  onSelectCurrency: (value: 'USD' | 'KRW' | 'EUR') => void;
};

export function SettingsScreen({
  appLanguage,
  appCurrency,
  onSelectLanguage,
  onSelectCurrency,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={[styles.addTabRow, {marginBottom: 10}]}>
        <View style={[styles.addTabPill, styles.addTabPillSelected]}>
          <Text style={[styles.addTabPillText, styles.addTabPillTextSelected]}>Settings</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferences</Text>
        <PickerRow
          label="Language"
          options={['English', 'Korean']}
          selected={appLanguage}
          onSelect={value => onSelectLanguage(value as 'English' | 'Korean')}
          mutedLabel
          listMinHeight={180}
          listMaxHeight={280}
          panelWhiteSurface
        />
        <PickerRow
          label="Unit"
          options={['USD', 'KRW', 'EUR']}
          selected={appCurrency}
          onSelect={value => onSelectCurrency(value as 'USD' | 'KRW' | 'EUR')}
          mutedLabel
          listMinHeight={180}
          listMaxHeight={280}
          panelWhiteSurface
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Support</Text>
        <Text style={styles.cardHint}>Need help or want to report an issue?</Text>
        <Text style={styles.cardHint}>Version: 0.0.1</Text>
      </View>
    </View>
  );
}
