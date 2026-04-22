import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { savePreferences } from '@/lib/storage';
import { useTheme } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Slide Data ───────────────────────────────────────────────────────────────

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'camera-outline',
    title: 'Fotoğraf Çek',
    description:
      'Mısır yaprağını net şekilde fotoğraflayın. Kamera veya galeriden görsel seçebilirsiniz.',
  },
  {
    id: '2',
    icon: 'leaf-outline',
    title: 'Analiz Et',
    description:
      'Yapay zeka modelimiz yaprağı inceleyerek hastalığı tespit eder. İnternet bağlantısı gerekmez.',
  },
  {
    id: '3',
    icon: 'bar-chart-outline',
    title: 'Sonuçları Gör',
    description:
      'Güven skoru ve 5 hastalık sınıfı için detaylı analiz sonuçlarını inceleyin.',
  },
  {
    id: '4',
    icon: 'time-outline',
    title: 'Geçmişi Takip Et',
    description:
      'Önceki teşhisleri kaydedin ve iki fotoğrafı yan yana karşılaştırarak hastalık ilerlemesini takip edin.',
  },
];

// ─── Onboarding Screen ────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  // Track visible slide index
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // Complete onboarding and navigate home
  const finishOnboarding = async () => {
    await savePreferences({ onboardingCompleted: true });
    router.replace('/');
  };

  // Advance to next slide
  const goToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  // ─── Render Slide ───────────────────────────────────────────────────────────

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.slideContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name={item.icon} size={80} color={colors.primary} />
        </View>
        <Text style={[styles.slideTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.slideDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
      </View>
    </View>
  );

  // ─── Dot Indicators ─────────────────────────────────────────────────────────

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              {
                width: isActive ? 10 : 8,
                height: isActive ? 10 : 8,
                borderRadius: isActive ? 5 : 4,
                backgroundColor: isActive ? colors.primary : colors.border,
              },
            ]}
          />
        );
      })}
    </View>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip button — hidden on last slide */}
      {!isLastSlide && (
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={finishOnboarding}
          accessibilityLabel="Tanıtımı atla"
          accessibilityHint="Ana ekrana git"
          accessibilityRole="button"
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Atla</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.flatList}
      />

      {/* Bottom area: dots + action button */}
      <View style={styles.bottomContainer}>
        {renderDots()}

        {isLastSlide ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton, { backgroundColor: colors.primary }]}
            onPress={finishOnboarding}
            accessibilityLabel="Başla"
            accessibilityHint="Tanıtımı tamamla ve ana ekrana git"
            accessibilityRole="button"
          >
            <Text style={styles.startButtonText}>Başla</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.nextButton, { borderColor: colors.primary }]}
            onPress={goToNext}
            accessibilityLabel="İleri"
            accessibilityHint="Sonraki slayta geç"
            accessibilityRole="button"
          >
            <Text style={[styles.nextButtonText, { color: colors.primary }]}>İleri</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    // width, height, borderRadius, backgroundColor set dynamically
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
    borderRadius: 24,
  },
  startButton: {
    // backgroundColor set dynamically
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    borderWidth: 1.5,
    gap: 6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
