import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/lib/theme';
import { getDiagnoses } from '@/lib/storage';
import type { DiagnosisRecord } from '@/lib/storage';
import DiseaseIcon from '@/components/DiseaseIcon';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// ─── Record Panel ─────────────────────────────────────────────────────────────

interface RecordPanelProps {
  record: DiagnosisRecord;
  isLandscape: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}

function RecordPanel({ record, isLandscape, colors }: RecordPanelProps) {
  const imageHeight = isLandscape ? undefined : 200;

  return (
    <View
      style={[
        styles.panel,
        isLandscape ? styles.panelLandscape : styles.panelPortrait,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Image */}
      <Image
        source={{ uri: record.imageUri }}
        style={[
          styles.image,
          isLandscape ? styles.imageLandscape : { height: imageHeight },
        ]}
        resizeMode="cover"
        accessibilityLabel={`${record.diseaseName} teşhis görseli`}
        accessibilityHint="Karşılaştırma için seçilen fotoğraf"
      />

      {/* Details */}
      <View style={styles.details}>
        {/* Disease name row */}
        <View style={styles.diseaseRow}>
          <DiseaseIcon
            diseaseId={record.diseaseId}
            size={28}
            accessibilityLabel={`${record.diseaseName} ikonu`}
          />
          <Text
            style={[styles.diseaseName, { color: colors.text }]}
            numberOfLines={2}
          >
            {record.diseaseName}
          </Text>
        </View>

        {/* Confidence */}
        <Text style={[styles.confidence, { color: colors.textSecondary }]}>
          Güven:{' '}
          <Text style={[styles.confidenceValue, { color: colors.text }]}>
            {(record.confidence * 100).toFixed(1)}%
          </Text>
        </Text>

        {/* Date */}
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatDate(record.timestamp)}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CompareScreen() {
  const { id1, id2 } = useLocalSearchParams<{ id1: string; id2: string }>();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [record1, setRecord1] = useState<DiagnosisRecord | null>(null);
  const [record2, setRecord2] = useState<DiagnosisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Load Records ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const all = await getDiagnoses();
        const r1 = all.find((r) => r.id === id1) ?? null;
        const r2 = all.find((r) => r.id === id2) ?? null;

        if (!r1 || !r2) {
          setError('Karşılaştırılacak kayıtlar bulunamadı.');
        } else {
          setRecord1(r1);
          setRecord2(r2);
        }
      } catch {
        setError('Kayıtlar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id1, id2]);

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.centered, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Kayıtlar yükleniyor…
        </Text>
      </SafeAreaView>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────────

  if (error || !record1 || !record2) {
    return (
      <SafeAreaView
        style={[styles.centered, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error ?? 'Kayıtlar bulunamadı.'}
        </Text>
      </SafeAreaView>
    );
  }

  // ─── Comparison Calculations ───────────────────────────────────────────────

  const sameDisease = record1.diseaseId === record2.diseaseId;
  const bannerBg = sameDisease ? colors.primary : colors.error;
  const bannerLabel = sameDisease ? '✓ Aynı Hastalık' : '⚠ Farklı Hastalık';

  const delta = Math.abs(record1.confidence - record2.confidence) * 100;
  const deltaFixed = delta.toFixed(1);

  let deltaText: string;
  let deltaColor: string;

  if (record1.confidence > record2.confidence) {
    deltaText = `↓ ${deltaFixed}% azaldı`;
    deltaColor = colors.error;
  } else if (record2.confidence > record1.confidence) {
    deltaText = `↑ ${deltaFixed}% arttı`;
    deltaColor = colors.primary;
  } else {
    deltaText = 'Değişim yok';
    deltaColor = colors.textSecondary;
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Comparison Banner */}
        <View
          style={[styles.banner, { backgroundColor: bannerBg }]}
          accessibilityRole="text"
          accessibilityLabel={bannerLabel}
          accessibilityHint="Karşılaştırma sonucu"
        >
          <Text style={styles.bannerText}>{bannerLabel}</Text>
        </View>

        {/* Confidence Delta */}
        <View style={[styles.deltaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.deltaLabel, { color: colors.textSecondary }]}>
            Güven farkı:{' '}
            <Text style={[styles.deltaValue, { color: deltaColor }]}>
              {deltaText}
            </Text>
          </Text>
        </View>

        {/* Record Panels */}
        <View
          style={[
            styles.panelsContainer,
            isLandscape ? styles.panelsLandscape : styles.panelsPortrait,
          ]}
        >
          <RecordPanel
            record={record1}
            isLandscape={isLandscape}
            colors={colors}
          />
          <RecordPanel
            record={record2}
            isLandscape={isLandscape}
            colors={colors}
          />
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
    flexGrow: 1,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },

  // ── Banner ──────────────────────────────────────────────────────────────────
  banner: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Delta ───────────────────────────────────────────────────────────────────
  deltaContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  deltaLabel: {
    fontSize: 14,
  },
  deltaValue: {
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Panels Container ────────────────────────────────────────────────────────
  panelsContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  panelsPortrait: {
    flexDirection: 'column',
  },
  panelsLandscape: {
    flexDirection: 'row',
  },

  // ── Individual Panel ────────────────────────────────────────────────────────
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  panelPortrait: {
    // Each panel takes full width in portrait
  },
  panelLandscape: {
    flex: 1,
  },

  // ── Image ───────────────────────────────────────────────────────────────────
  image: {
    width: '100%',
  },
  imageLandscape: {
    height: 180,
  },

  // ── Details ─────────────────────────────────────────────────────────────────
  details: {
    padding: 12,
    gap: 6,
  },
  diseaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diseaseName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  confidence: {
    fontSize: 13,
  },
  confidenceValue: {
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
});
