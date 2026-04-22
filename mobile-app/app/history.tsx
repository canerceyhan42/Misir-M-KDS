import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { getDiagnoses, deleteDiagnosis, clearAllDiagnoses } from '@/lib/storage';
import DiagnosisCard from '@/components/DiagnosisCard';
import type { DiagnosisRecord } from '@/lib/storage';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

// ─── Component ────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ─── Load Data ──────────────────────────────────────────────────────────────

  const loadDiagnoses = useCallback(async () => {
    const records = await getDiagnoses();
    setDiagnoses(records);
  }, []);

  // Reload on screen focus
  useFocusEffect(
    useCallback(() => {
      loadDiagnoses();
    }, [loadDiagnoses])
  );

  // ─── Header Buttons ─────────────────────────────────────────────────────────

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          {/* Compare toggle */}
          <TouchableOpacity
            onPress={handleToggleCompareMode}
            style={styles.headerButton}
            accessibilityLabel={compareMode ? "Karşılaştırma modunu kapat" : "Karşılaştırma modunu aç"}
            accessibilityHint="İki kayıt seçerek karşılaştırma yapabilirsiniz"
            accessibilityRole="button"
          >
            <Ionicons
              name="git-compare-outline"
              size={22}
              color={compareMode ? colors.accent : colors.text}
            />
          </TouchableOpacity>

          {/* Clear all */}
          <TouchableOpacity
            onPress={handleClearAll}
            style={styles.headerButton}
            accessibilityLabel="Tüm kayıtları sil"
            accessibilityHint="Tüm teşhis kayıtlarını kalıcı olarak siler"
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, compareMode, colors]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleToggleCompareMode = useCallback(() => {
    setCompareMode((prev) => {
      if (prev) {
        // Exiting compare mode — clear selection
        setSelectedIds([]);
      }
      return !prev;
    });
  }, []);

  const handleCardPress = useCallback(
    (record: DiagnosisRecord) => {
      if (compareMode) {
        // Toggle selection (max 2)
        setSelectedIds((prev) => {
          if (prev.includes(record.id)) {
            return prev.filter((id) => id !== record.id);
          }
          if (prev.length >= 2) {
            return prev; // Already have 2 selected
          }
          return [...prev, record.id];
        });
      } else {
        // Show disease name alert (full detail view is out of scope)
        Alert.alert(record.diseaseName, `Güven: ${(record.confidence * 100).toFixed(1)}%`);
      }
    },
    [compareMode]
  );

  const handleLongPress = useCallback((record: DiagnosisRecord) => {
    Alert.alert(
      'Kaydı Sil',
      'Bu teşhis kaydını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => deleteDiagnosis(record.id).then(loadDiagnoses),
        },
      ]
    );
  }, [loadDiagnoses]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Tüm Kayıtları Sil',
      'Tüm teşhis kayıtlarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => clearAllDiagnoses().then(loadDiagnoses),
        },
      ]
    );
  }, [loadDiagnoses]);

  const handleCompare = useCallback(() => {
    if (selectedIds.length === 2) {
      router.push(`/compare?id1=${selectedIds[0]}&id2=${selectedIds[1]}`);
    }
  }, [selectedIds, router]);

  // ─── Render Helpers ─────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: DiagnosisRecord }) => (
      <DiagnosisCard
        record={item}
        onPress={() => handleCardPress(item)}
        onLongPress={() => handleLongPress(item)}
        compareMode={compareMode}
        selected={selectedIds.includes(item.id)}
      />
    ),
    [handleCardPress, handleLongPress, compareMode, selectedIds]
  );

  const keyExtractor = useCallback((item: DiagnosisRecord) => item.id, []);

  // ─── Empty State ─────────────────────────────────────────────────────────────

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {'Henüz teşhis kaydı yok\nFotoğraf çekerek başlayın'}
      </Text>
    </View>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={diagnoses}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={diagnoses.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Comparison bottom bar — shown when 2 items selected */}
      {compareMode && selectedIds.length === 2 && (
        <View
          style={[
            styles.compareBar,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <Text style={[styles.compareBarText, { color: colors.text }]}>
            2 kayıt seçildi
          </Text>
          <TouchableOpacity
            style={[styles.compareButton, { backgroundColor: colors.primary }]}
            onPress={handleCompare}
            accessibilityLabel="Seçili kayıtları karşılaştır"
            accessibilityHint="İki kayıt arasındaki farkları gösterir"
            accessibilityRole="button"
          >
            <Text style={styles.compareButtonText}>Karşılaştır</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyListContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButton: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compareBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  compareBarText: {
    fontSize: 14,
    fontWeight: '500',
  },
  compareButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 8,
  },
  compareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
