import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useNavigation } from 'expo-router';
import { useTheme } from '@/lib/theme';
import { getDiagnoses } from '@/lib/storage';

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [diagnosisCount, setDiagnosisCount] = useState(0);

  // Load diagnosis count whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      getDiagnoses().then((records) => {
        setDiagnosisCount(records.length);
      });
    }, [])
  );

  // Add settings button to header top-right
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={{ marginRight: 20 }}
          accessibilityLabel="Ayarlar"
          accessibilityHint="Ayarlar ekranını açar"
        >
          <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.textSecondary]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      router.push({ pathname: '/result', params: { imageUri: result.assets[0].uri } });
    }
  };

  const badgeLabel = diagnosisCount > 99 ? '99+' : String(diagnosisCount);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>Mısır-M-KDS</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Mısır Yaprağı Hastalık Teşhis Sistemi
      </Text>

      <View style={styles.buttonsContainer}>
        {/* Camera button */}
        <TouchableOpacity
          style={[styles.buttonMain, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/camera')}
          accessibilityLabel="Kamerayı Aç"
          accessibilityHint="Fotoğraf çekmek için kamerayı açar"
        >
          <Text style={styles.buttonText}>Kamerayı Aç</Text>
        </TouchableOpacity>

        {/* Gallery button */}
        <TouchableOpacity
          style={[styles.buttonSub, { backgroundColor: colors.surface, borderColor: colors.primary }]}
          onPress={pickImage}
          accessibilityLabel="Galeriden Seç"
          accessibilityHint="Galeriden bir fotoğraf seçer"
        >
          <Text style={[styles.buttonTextSecondary, { color: colors.primary }]}>Galeriden Seç</Text>
        </TouchableOpacity>

        {/* History button with badge */}
        <View style={styles.historyButtonWrapper}>
          <TouchableOpacity
            style={[styles.buttonSub, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            onPress={() => router.push('/history')}
            accessibilityLabel={`Geçmiş, ${diagnosisCount} kayıt`}
            accessibilityHint="Geçmiş teşhis kayıtlarını görüntüler"
          >
            <Ionicons name="time-outline" size={20} color={colors.primary} style={styles.historyIcon} />
            <Text style={[styles.buttonTextSecondary, { color: colors.primary }]}>Geçmiş</Text>
          </TouchableOpacity>

          {diagnosisCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 15,
  },
  buttonMain: {
    paddingVertical: 15,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonSub: {
    paddingVertical: 15,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    fontSize: 18,
    fontWeight: '600',
  },
  historyButtonWrapper: {
    position: 'relative',
  },
  historyIcon: {
    marginRight: 8,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
