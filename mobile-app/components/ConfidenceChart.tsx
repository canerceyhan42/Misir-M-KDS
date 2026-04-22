import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import DiseaseIcon from '@/components/DiseaseIcon';
import expertSystem from '@/assets/expert_system.json';

// ─── Class name lookup ────────────────────────────────────────────────────────

const CLASS_NAMES: Record<string, string> = {};
(expertSystem.diseases as Array<{ id: string; name: string }>).forEach((d) => {
  CLASS_NAMES[d.id] = d.name;
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface ConfidenceChartProps {
  scores: Record<string, number>;
  predictedId: string;
}

// ─── Animated Bar ─────────────────────────────────────────────────────────────

interface BarProps {
  diseaseId: string;
  score: number;
  isPredicted: boolean;
  barColor: string;
  delay: number;
  maxScore: number;
}

function AnimatedBar({ diseaseId, score, isPredicted, barColor, delay, maxScore }: BarProps) {
  const { colors } = useTheme();
  const widthProgress = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      widthProgress.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, widthProgress]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${widthProgress.value * (score / maxScore) * 100}%` as any,
  }));

  const displayName = CLASS_NAMES[diseaseId] ?? diseaseId;
  const percentage = (score * 100).toFixed(1);

  return (
    <View style={styles.row}>
      {/* Icon + label row */}
      <View style={styles.labelRow}>
        <DiseaseIcon diseaseId={diseaseId} size={20} style={styles.rowIcon} />
        <Text
          style={[styles.labelText, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayName}
        </Text>
        <Text style={[styles.percentText, { color: isPredicted ? barColor : colors.textSecondary }]}>
          {percentage}%
        </Text>
      </View>

      {/* Bar track */}
      <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[styles.barFill, { backgroundColor: barColor }, animatedBarStyle]}
        />
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ConfidenceChart = React.memo(function ConfidenceChart({
  scores,
  predictedId,
}: ConfidenceChartProps) {
  const { colors } = useTheme();

  // Sort entries descending by score
  const sortedEntries = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const maxScore = sortedEntries.length > 0 ? sortedEntries[0][1] : 1;

  const otherBarColor = '#BDBDBD';

  // Build accessibility label listing all scores
  const accessibilityLabel = sortedEntries
    .map(([id, score]) => {
      const name = CLASS_NAMES[id] ?? id;
      return `${name}: ${(score * 100).toFixed(1)}%`;
    })
    .join(', ');

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Güven skorları: ${accessibilityLabel}`}
      accessibilityHint="Tüm hastalıklar için tahmin güven skorlarını gösterir"
    >
      {sortedEntries.map(([diseaseId, score], index) => {
        const isPredicted = diseaseId === predictedId;
        const barColor = isPredicted ? colors.accent : otherBarColor;
        return (
          <AnimatedBar
            key={diseaseId}
            diseaseId={diseaseId}
            score={score}
            isPredicted={isPredicted}
            barColor={barColor}
            delay={index * 50}
            maxScore={maxScore}
          />
        );
      })}
    </View>
  );
});

export default ConfidenceChart;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  row: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowIcon: {
    marginRight: 6,
  },
  labelText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  percentText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 48,
    textAlign: 'right',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
