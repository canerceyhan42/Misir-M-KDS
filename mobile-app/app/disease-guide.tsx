import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import DiseaseIcon from '@/components/DiseaseIcon';
import expertSystem from '@/assets/expert_system.json';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiseaseEntry {
  id: string;
  name: string;
  description: string;
  icon_name?: string;
  example_image?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DiseaseGuideScreen() {
  const { colors } = useTheme();

  const diseases = expertSystem.diseases as DiseaseEntry[];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {diseases.map((disease) => (
          <View
            key={disease.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                shadowColor: colors.text,
                borderColor: colors.border,
              },
            ]}
          >
            {/* ── Icon ── */}
            <View style={styles.iconContainer}>
              <DiseaseIcon
                diseaseId={disease.id}
                size={48}
                accessibilityLabel={`${disease.name} ikonu`}
              />
            </View>

            {/* ── Disease Name ── */}
            <Text style={[styles.diseaseName, { color: colors.text }]}>
              {disease.name}
            </Text>

            {/* ── Placeholder Image Area ── */}
            <View
              style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}
              accessibilityLabel="Örnek görsel alanı"
              accessibilityHint="Hastalık örnek görseli için yer tutucu"
            >
              <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
                Örnek Görsel
              </Text>
            </View>

            {/* ── Description ── */}
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {disease.description}
            </Text>
          </View>
        ))}
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
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  imagePlaceholder: {
    height: 160,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
});
