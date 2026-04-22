import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { getFeedback, exportFeedback } from '@/lib/storage';
import type { FeedbackRecord } from '@/lib/storage';
import DiseaseIcon from '@/components/DiseaseIcon';
import expertSystem from '@/assets/expert_system.json';

// ─── Disease name lookup ──────────────────────────────────────────────────────

const DISEASE_NAMES: Record<string, string> = Object.fromEntries(
  (expertSystem.diseases as Array<{ id: string; name: string }>).map((d) => [d.id, d.name])
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeedbackStatsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [records, setRecords] = useState<FeedbackRecord[]>([]);

  // ─── Load Data ──────────────────────────────────────────────────────────────

  const loadFeedback = useCallback(async () => {
    const data = await getFeedback();
    setRecords(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeedback();
    }, [loadFeedback])
  );

  // ─── Header Export Button ────────────────────────────────────────────────────

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleExport}
          style={styles.headerButton}
          accessibilityLabel="Geri bildirimleri dışa aktar"
          accessibilityHint="JSON formatında geri bildirim verilerini gösterir"
          accessibilityRole="button"
        >
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    const json = await exportFeedback();
    const preview = json.length > 300 ? json.slice(0, 300) + '...' : json;
    Alert.alert('Geri Bildirim Verisi', preview);
  }, []);

  // ─── Computed Stats ──────────────────────────────────────────────────────────

  const total = records.length;
  const positiveCount = records.filter((r) => r.isCorrect === true).length;
  const negativeCount = records.filter((r) => r.isCorrect === false).length;
  const positivePercent = total > 0 ? Math.round((positiveCount / total) * 100) : 0;
  const negativePercent = total > 0 ? Math.round((negativeCount / total) * 100) : 0;

  // Group negative feedback by correctDiseaseId
  const negativeByDisease: Record<string, number> = {};
  for (const r of records) {
    if (!r.isCorrect && r.correctDiseaseId) {
      negativeByDisease[r.correctDiseaseId] = (negativeByDisease[r.correctDiseaseId] ?? 0) + 1;
    }
  }
  const sortedNegative = Object.entries(negativeByDisease).sort((a, b) => b[1] - a[1]);

  // ─── Empty State ─────────────────────────────────────────────────────────────

  if (total === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Henüz geri bildirim yok
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stat Cards ── */}
        <View style={styles.statsRow}>
          {/* Toplam */}
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam</Text>
          </View>

          {/* Doğru */}
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#2E7D32' }]}>{positiveCount}</Text>
            <Text style={[styles.statPercent, { color: '#2E7D32' }]}>{positivePercent}%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Doğru ✓</Text>
          </View>

          {/* Yanlış */}
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.error }]}>{negativeCount}</Text>
            <Text style={[styles.statPercent, { color: colors.error }]}>{negativePercent}%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Yanlış ✗</Text>
          </View>
        </View>

        {/* ── Negative Breakdown ── */}
        {sortedNegative.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Yanlış Teşhis Dağılımı
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              {sortedNegative.map(([diseaseId, count], index) => {
                const isLast = index === sortedNegative.length - 1;
                return (
                  <View key={diseaseId}>
                    <View style={styles.diseaseRow}>
                      <DiseaseIcon
                        diseaseId={diseaseId}
                        size={24}
                        accessibilityLabel={`${DISEASE_NAMES[diseaseId] ?? diseaseId} ikonu`}
                      />
                      <Text
                        style={[styles.diseaseName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {DISEASE_NAMES[diseaseId] ?? diseaseId}
                      </Text>
                      <Text style={[styles.diseaseCount, { color: colors.textSecondary }]}>
                        {count}
                      </Text>
                    </View>
                    {!isLast && (
                      <View
                        style={[styles.divider, { borderBottomColor: colors.border }]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
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
  headerButton: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Empty State ──
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  // ── Stat Cards ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  statPercent: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  // ── Section ──
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  // ── Disease Row ──
  diseaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  diseaseName: {
    flex: 1,
    fontSize: 15,
  },
  diseaseCount: {
    fontSize: 15,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'right',
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
});
