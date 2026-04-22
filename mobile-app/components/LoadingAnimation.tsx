import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  useAnimatedStyle,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface LoadingAnimationProps {
  step: string;
  onError?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoadingAnimation({ step, onError = false }: LoadingAnimationProps) {
  const { colors } = useTheme();

  // Shared values for animations
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  // ── Pulse animation (normal state) ──────────────────────────────────────────
  useEffect(() => {
    if (onError) return;

    scale.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, // infinite
      true, // reverse
    );

    return () => {
      cancelAnimation(scale);
      scale.value = 1;
    };
  }, [onError, scale]);

  // ── Shake animation (error state) ───────────────────────────────────────────
  useEffect(() => {
    if (!onError) return;

    // Stop pulse
    cancelAnimation(scale);
    scale.value = withTiming(1, { duration: 100 });

    // 3 cycles of ±10px shake, 80ms each step
    translateX.value = withSequence(
      withTiming(10,  { duration: 80, easing: Easing.linear }),
      withTiming(-10, { duration: 80, easing: Easing.linear }),
      withTiming(10,  { duration: 80, easing: Easing.linear }),
      withTiming(-10, { duration: 80, easing: Easing.linear }),
      withTiming(10,  { duration: 80, easing: Easing.linear }),
      withTiming(-10, { duration: 80, easing: Easing.linear }),
      withTiming(0,   { duration: 80, easing: Easing.linear }),
    );

    return () => {
      cancelAnimation(translateX);
      translateX.value = 0;
    };
  }, [onError, scale, translateX]);

  // ── Animated styles ──────────────────────────────────────────────────────────
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
    ],
  }));

  return (
    <View style={styles.container} accessibilityLiveRegion="polite" accessibilityLabel={step} accessibilityHint="Analiz durumu">
      <Animated.View style={animatedIconStyle}>
        <Ionicons
          name="leaf-outline"
          size={48}
          color={onError ? colors.error : colors.primary}
          accessibilityLabel={onError ? 'Hata oluştu' : 'Analiz ediliyor'}
          accessibilityHint={onError ? 'Analiz sırasında bir hata meydana geldi' : 'Görsel işleniyor'}
        />
      </Animated.View>

      <Text
        style={[
          styles.stepText,
          {
            color: onError ? colors.error : colors.textSecondary,
          },
        ]}
      >
        {step}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
