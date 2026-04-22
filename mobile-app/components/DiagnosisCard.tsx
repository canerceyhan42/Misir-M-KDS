import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import DiseaseIcon from '@/components/DiseaseIcon';
import type { DiagnosisRecord } from '@/lib/storage';

// ─── Date Formatter ───────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DiagnosisCardProps {
  record: DiagnosisRecord;
  onPress: () => void;
  onLongPress: () => void;
  compareMode?: boolean;
  selected?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const DiagnosisCard = React.memo(function DiagnosisCard({
  record,
  onPress,
  onLongPress,
  compareMode = false,
  selected = false,
}: DiagnosisCardProps) {
  const { colors } = useTheme();

  const confidencePercent = `${(record.confidence * 100).toFixed(1)}%`;
  const formattedDate = formatDate(record.timestamp);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.accent : colors.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityLabel={`${record.diseaseName}, güven: ${confidencePercent}, tarih: ${formattedDate}`}
      accessibilityHint={compareMode ? "Karşılaştırma için seç" : "Detayları görüntüle"}
      accessibilityRole="button"
      accessibilityState={{ selected: compareMode ? selected : undefined }}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: record.imageUri }}
          style={styles.thumbnail}
          contentFit="cover"
          accessibilityLabel="Teşhis görseli"
          accessibilityHint="Analiz edilen mısır yaprağı fotoğrafı"
        />
        {/* Compare mode checkbox overlay */}
        {compareMode && (
          <View style={[styles.checkboxOverlay, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
            <Ionicons
              name={selected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={selected ? colors.accent : '#FFFFFF'}
              accessibilityLabel={selected ? 'Seçildi' : 'Seçilmedi'}
            />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Disease row */}
        <View style={styles.diseaseRow}>
          <DiseaseIcon
            diseaseId={record.diseaseId}
            size={24}
            style={styles.diseaseIcon}
            accessibilityLabel={`${record.diseaseName} ikonu`}
          />
          <Text
            style={[styles.diseaseName, { color: colors.text }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {record.diseaseName}
          </Text>
        </View>

        {/* Confidence */}
        <Text style={[styles.confidence, { color: colors.textSecondary }]}>
          Güven: {confidencePercent}
        </Text>

        {/* Date */}
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formattedDate}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default DiagnosisCard;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  checkboxOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  diseaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  diseaseIcon: {
    marginRight: 6,
  },
  diseaseName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  confidence: {
    fontSize: 12,
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
  },
});
