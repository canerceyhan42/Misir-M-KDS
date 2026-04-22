import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import {
  getDiagnoses,
  clearAllDiagnoses,
  exportFeedback,
  savePreferences,
} from '@/lib/storage';

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // ─── Uygulama Handlers ───────────────────────────────────────────────────────

  const handleReplayOnboarding = useCallback(async () => {
    await savePreferences({ onboardingCompleted: false });
    router.push('/onboarding');
  }, [router]);

  const handleDiseaseGuide = useCallback(() => {
    router.push('/disease-guide');
  }, [router]);

  const handleFeedbackStats = useCallback(() => {
    router.push('/feedback-stats');
  }, [router]);

  // ─── Veri Handlers ───────────────────────────────────────────────────────────

  const handleExportDiagnoses = useCallback(async () => {
    const diagnoses = await getDiagnoses();
    const json = JSON.stringify(diagnoses, null, 2);
    const preview = json.length > 200 ? json.slice(0, 200) + '...' : json;
    Alert.alert('Teşhis Geçmişi', preview);
  }, []);

  const handleExportFeedback = useCallback(async () => {
    const result = await exportFeedback();
    Alert.alert('Geri Bildirimler', result);
  }, []);

  const handleClearAllData = useCallback(() => {
    Alert.alert(
      'Tüm Verileri Sil',
      'Tüm teşhis kayıtları ve tercihler sıfırlanacak. Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await clearAllDiagnoses();
            await savePreferences({ onboardingCompleted: false });
            Alert.alert('Başarılı', 'Tüm veriler silindi.');
          },
        },
      ]
    );
  }, []);

  // ─── Render Helpers ──────────────────────────────────────────────────────────

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{title}</Text>
  );

  const renderRow = (
    icon: React.ComponentProps<typeof Ionicons>['name'],
    label: string,
    onPress: () => void,
    iconColor?: string,
    labelColor?: string,
    isLast?: boolean
  ) => (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: colors.surface },
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Ayar seçeneğini aç"
    >
      <Ionicons
        name={icon}
        size={22}
        color={iconColor ?? colors.primary}
        style={styles.rowIcon}
      />
      <Text style={[styles.rowLabel, { color: labelColor ?? colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Uygulama ── */}
        {renderSectionHeader('UYGULAMA')}
        <View style={[styles.card, { backgroundColor: colors.surface, overflow: 'hidden' }]}>
          {renderRow('play-circle-outline', 'Tanıtımı Tekrar Gör', handleReplayOnboarding, colors.primary, undefined, false)}
          {renderRow('book-outline', 'Hastalık Rehberi', handleDiseaseGuide, colors.primary, undefined, false)}
          {renderRow('stats-chart-outline', 'Geri Bildirim İstatistikleri', handleFeedbackStats, colors.primary, undefined, true)}
        </View>

        {/* ── Veri ── */}
        {renderSectionHeader('VERİ')}
        <View style={[styles.card, { backgroundColor: colors.surface, overflow: 'hidden' }]}>
          {renderRow('download-outline', 'Geçmişi Dışa Aktar', handleExportDiagnoses, colors.primary, undefined, false)}
          {renderRow('share-outline', 'Geri Bildirimleri Dışa Aktar', handleExportFeedback, colors.primary, undefined, false)}
          {renderRow('trash-outline', 'Tüm Verileri Sil', handleClearAllData, colors.error, colors.error, true)}
        </View>

        {/* ── Hakkında ── */}
        {renderSectionHeader('HAKKINDA')}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Uygulama</Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>Mısır-M-KDS</Text>
          </View>
          <View
            style={[styles.aboutDivider, { borderBottomColor: colors.border }]}
          />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Sürüm</Text>
            <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0</Text>
          </View>
          <View
            style={[styles.aboutDivider, { borderBottomColor: colors.border }]}
          />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Açıklama</Text>
            <Text style={[styles.aboutValue, { color: colors.text, flex: 1, textAlign: 'right' }]}>
              Mısır Yaprağı Hastalık Teşhis Sistemi
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  // ── Rows ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowIcon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
  },
  // ── About ──
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  aboutDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  aboutLabel: {
    fontSize: 16,
  },
  aboutValue: {
    fontSize: 16,
    fontWeight: '500',
  },
});
