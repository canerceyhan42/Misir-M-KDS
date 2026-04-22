import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Buffer } from 'buffer';
import * as jpeg from 'jpeg-js';

import LoadingAnimation from '@/components/LoadingAnimation';
import DiseaseIcon from '@/components/DiseaseIcon';
import ConfidenceChart from '@/components/ConfidenceChart';
import { saveDiagnosis, saveFeedback, generateId, DiagnosisRecord } from '@/lib/storage';
import { useTheme } from '@/lib/theme';

// ─── Sabitler ────────────────────────────────────────────────────────────────
/** Modelin tahminini geçerli sayması için gereken minimum güven eşiği */
const CONFIDENCE_THRESHOLD = 0.60;
const expertSystemData = require('../assets/expert_system.json');

/** Model çıktısındaki indeks → hastalık id eşlemesi (expert_system.json "classes" alanı ile senkron) */
const CLASS_NAMES: string[] = expertSystemData.classes;
// ['asfalt_lekesi', 'gri_leke', 'pas', 'saglikli', 'yaprak_kararmasi']

const ALL_DISEASES: Array<{ id: string; name: string }> = expertSystemData.diseases;

// ─── Yardımcı: Görüntüyü TFLite girişi için hazırla ──────────────────────────
/**
 * Verilen görüntü URI'sini 224×224'e yeniden boyutlandırır,
 * JPEG'i jpeg-js ile decode ederek gerçek RGBA piksel değerlerini alır,
 * her piksel kanalını (0-255) → (piksel / 127.5) - 1.0 formülüyle
 * [-1, 1] aralığına normalize eder ve Float32Array döndürür.
 *
 * BELLEK OPTİMİZASYONU: Büyük görseller için önce 512x512'ye küçültüp
 * sonra 224x224'e indiriyoruz. Bu sayede jpeg-js decode işlemi çok daha
 * az bellek kullanıyor.
 *
 * @param uri Yerel görüntü URI'si (camera / gallery)
 * @returns Float32Array boyutu: 224 * 224 * 3 = 150.528 eleman
 */
async function preprocessImage(uri: string): Promise<Float32Array> {
  try {
    // ADIM 1: Önce orta boyuta küçült (512x512) - bellek tasarrufu
    // Büyük görseller (4000x3000) direkt 224x224'e indirildiğinde
    // jpeg-js decode işlemi çok fazla bellek kullanıyor
    console.log('[Preprocessing] Step 1: Resizing to 512x512...');
    const mediumResize = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );

    // ADIM 2: Şimdi 224x224'e küçült (model input size)
    console.log('[Preprocessing] Step 2: Resizing to 224x224...');
    const finalResize = await ImageManipulator.manipulateAsync(
      mediumResize.uri,
      [{ resize: { width: 224, height: 224 } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );

    console.log(`[Preprocessing] Final resized URI: ${finalResize.uri}`);

    // ADIM 3: Base64 olarak oku (artık çok küçük)
    const base64 = await FileSystem.readAsStringAsync(finalResize.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log(`[Preprocessing] Base64 length: ${base64.length} chars (~${Math.round(base64.length / 1024)}KB)`);

    // ADIM 4: Base64 → Buffer
    const jpegBuffer = Buffer.from(base64, 'base64');
    console.log(`[Preprocessing] JPEG buffer: ${jpegBuffer.length} bytes (~${Math.round(jpegBuffer.length / 1024)}KB)`);

    // ADIM 5: JPEG decode (artık çok küçük olduğu için bellek sorunu yok)
    const decoded = jpeg.decode(jpegBuffer, {
      useTArray: true,
      formatAsRGBA: true,
    });

    console.log(`[Preprocessing] Decoded: ${decoded.width}x${decoded.height}, RGBA bytes: ${decoded.data.length}`);

    // ADIM 6: RGBA → RGB Float32Array
    // ÖNEMLİ: Model içinde preprocess_input katmanı gömülü olduğundan
    // ekstra normalizasyon YAPILMAMALI. Piksel değerleri 0-255 arasında
    // ham (orijinal) haliyle Float32Array'e kopyalanıyor.
    const INPUT_SIZE = 224 * 224 * 3;
    const floatArray = new Float32Array(INPUT_SIZE);

    let floatIdx = 0;
    for (let i = 0; i < decoded.data.length; i += 4) {
      floatArray[floatIdx++] = decoded.data[i];       // R (0-255)
      floatArray[floatIdx++] = decoded.data[i + 1];   // G (0-255)
      floatArray[floatIdx++] = decoded.data[i + 2];   // B (0-255)
    }

    console.log(`[Preprocessing] ✓ Float32Array ready: ${floatArray.length} elements (raw 0-255, no normalization)`);

    return floatArray;

  } catch (error: any) {
    console.error('[Preprocessing Error]', error);
    throw new Error(`Görüntü işleme hatası: ${error.message}`);
  }
}

// ─── Yardımcı: Argmax ────────────────────────────────────────────────────────
/**
 * Float32Array içindeki en yüksek değerin indeksini ve değerini döndürür.
 */
function argmax(arr: Float32Array | number[]): { index: number; value: number } {
  let maxIndex = 0;
  let maxValue = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > maxValue) {
      maxValue = arr[i];
      maxIndex = i;
    }
  }
  return { index: maxIndex, value: maxValue };
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────
export default function ResultScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const { colors } = useTheme();

  const [analyzing, setAnalyzing] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [savedRecord, setSavedRecord] = useState<DiagnosisRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('Model yükleniyor...');

  // Feedback state
  const [feedbackState, setFeedbackState] = useState<'pending' | 'submitted'>('pending');
  const [showDiseaseSelector, setShowDiseaseSelector] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log('[ResultScreen] useEffect triggered, imageUri:', imageUri);
    
    const analyzeImage = async () => {
      if (!imageUri) {
        console.log('[ResultScreen] No imageUri provided, skipping analysis');
        setErrorMsg('Görsel URI bulunamadı');
        setAnalyzing(false);
        return;
      }

      console.log('[ResultScreen] Starting analysis for:', imageUri);
      setAnalyzing(true);
      let model: TensorflowModel | null = null;

      try {
        // BELLEK OPTİMİZASYONU: Garbage collection zorla
        if (global.gc) {
          global.gc();
        }

        // ── Adım 1: TFLite model yükleme ────────────────────────────────────
        setLoadingStep('Model yükleniyor (ResNet50 TFLite)...');
        // Model dosyasını bundle'dan yükle (URL'den değil - bellek tasarrufu)
        const modelAsset = require('../assets/hafif_model.tflite');
        
        // Bellek kontrolü
        console.log('[Memory] Loading model, size: ~93MB');
        
        model = await loadTensorflowModel(modelAsset);
        console.log('[TFLite] Model başarıyla yüklendi (bundle).');

        // ── Adım 2: Ön işleme (Preprocessing) ───────────────────────────────
        setLoadingStep('Görsel işleniyor (224×224 normalizasyon)...');
        const inputTensor = await preprocessImage(imageUri);
        console.log('[Preprocessing] Float32Array hazır, eleman sayısı:', inputTensor.length);

        // ── Adım 3: Model çıkarımı (Inference) ──────────────────────────────
        setLoadingStep('Hastalık analiz ediliyor...');
        const outputs = await model.run([inputTensor]);
        // outputs[0] → 5 elemanlı olasılık dizisi
        const probabilities = outputs[0] as Float32Array;
        console.log('[TFLite] Ham çıktı:', Array.from(probabilities));

        // ── Adım 4: Son işleme (Postprocessing) ─────────────────────────────
        // Model son katmanında zaten softmax uyguluyor, çıktı doğrudan olasılık.
        // Tekrar softmax uygulamak olasılıkları bozar — ham çıktı kullanılıyor.
        const softmaxProbs = Array.from(probabilities);

        // Tüm sınıfların olasılıklarını logla (debug amaçlı)
        console.log('[TFLite] Olasılıklar (model softmax çıktısı):');
        CLASS_NAMES.forEach((name, i) => {
          console.log(`  ${name}: %${(softmaxProbs[i] * 100).toFixed(2)}`);
        });

        const { index: bestIndex, value: bestValue } = argmax(softmaxProbs);
        const predictedClassId = CLASS_NAMES[bestIndex];
        const confidence = bestValue; // 0.0 – 1.0 arası olasılık

        console.log('[Sonuç] Sınıf:', predictedClassId, '| Güven:', (confidence * 100).toFixed(1) + '%');

        // ── Adım 5: Güven eşiği kontrolü ────────────────────────────────────
        if (confidence < CONFIDENCE_THRESHOLD) {
          setErrorMsg(
            `⚠️ Tanımlanamadı: Görsel bu 5 sınıftan hiçbirine yeterince benzemiyor (en yüksek güven: %${(confidence * 100).toFixed(1)}).\n\nLütfen mısır yaprağını net şekilde gösteren bir fotoğraf çekin.`
          );
          setAnalyzing(false);
          return;
        }

        // Expert system'den hastalık bilgisini çek
        const disease = (expertSystemData.diseases as any[]).find(
          (d) => d.id === predictedClassId
        );

        if (!disease) {
          throw new Error(`Sınıf eşleşmesi bulunamadı: ${predictedClassId}`);
        }

        // ── Adım 6: Teşhisi kaydet ───────────────────────────────────────────
        const record: DiagnosisRecord = {
          id: generateId(),
          imageUri,
          diseaseId: predictedClassId,
          diseaseName: disease.name,
          confidence,
          allScores: Object.fromEntries(CLASS_NAMES.map((name, i) => [name, softmaxProbs[i]])),
          timestamp: new Date().toISOString(),
        };
        await saveDiagnosis(record);
        setSavedRecord(record);

        setResult({ disease, confidence, allScores: record.allScores });

      } catch (error: any) {
        console.error('[Hata]', error);
        setErrorMsg(
          `Hata oluştu: ${error?.message ?? String(error)}\n\nNot: TFLite modeli Development Build gerektirir. Expo Go ile çalışmaz.`
        );
      } finally {
        // TFLite modeli bellekten serbest bırak
        if (model) {
          try { (model as any).dispose?.(); } catch (_) {}
        }
        setAnalyzing(false);
      }
    };

    analyzeImage();
  }, [imageUri]);

  // ─── Feedback Handlers ─────────────────────────────────────────────────────

  const handleFeedbackYes = async () => {
    if (!savedRecord) return;
    await saveFeedback({
      id: generateId(),
      diagnosisId: savedRecord.id,
      isCorrect: true,
      timestamp: new Date().toISOString(),
    });
    setFeedbackMessage('Teşekkürler!');
    setFeedbackState('submitted');
  };

  const handleFeedbackNo = () => {
    setShowDiseaseSelector(true);
  };

  const handleDiseaseSelect = async (selectedId: string) => {
    if (!savedRecord) return;
    await saveFeedback({
      id: generateId(),
      diagnosisId: savedRecord.id,
      isCorrect: false,
      correctDiseaseId: selectedId,
      timestamp: new Date().toISOString(),
    });
    setFeedbackMessage('Geri bildiriminiz kaydedildi.');
    setShowDiseaseSelector(false);
    setFeedbackState('submitted');
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={styles.noImage}>
          <Text style={{ color: colors.text }}>Görsel bulunamadı</Text>
        </View>
      )}

      <View style={styles.contentContainer}>
        {analyzing ? (
          <LoadingAnimation step={loadingStep} onError={!!errorMsg} />
        ) : errorMsg ? (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '1A' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>⚠️ Hata</Text>
            <Text style={[styles.errorSubText, { color: colors.error }]}>{errorMsg}</Text>
          </View>
        ) : result ? (
          <View style={styles.resultContainer}>
            <Text style={[styles.resultTitle, { color: colors.textSecondary }]}>Teşhis Sonucu</Text>

            {/* Disease name with icon */}
            <View style={styles.diseaseNameRow}>
              <DiseaseIcon
                diseaseId={result.disease.id}
                size={32}
                style={styles.diseaseIcon}
                accessibilityLabel={`${result.disease.name} ikonu`}
              />
              <Text style={[styles.diseaseName, { color: colors.error }]}>
                {result.disease.name}
              </Text>
            </View>

            <Text style={[styles.confidence, { color: colors.primary }]}>
              %{(Number(result.confidence) * 100).toFixed(1)} oranında eminim
            </Text>

            <Text style={[styles.description, { color: colors.text }]}>
              {result.disease.description}
            </Text>

            {/* Confidence Chart Card */}
            <View style={[styles.adviceCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.adviceTitle, { color: colors.primary }]}>
                📊 Güven Skorları
              </Text>
              <ConfidenceChart
                scores={result.allScores}
                predictedId={result.disease.id}
              />
            </View>

            <View style={[styles.adviceCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.adviceTitle, { color: colors.primary }]}>🌱 Kültürel Tavsiyeler</Text>
              {result.disease.cultural_advice.map((advice: string, index: number) => (
                <Text key={index} style={[styles.adviceItem, { color: colors.textSecondary }]}>
                  • {advice}
                </Text>
              ))}
            </View>

            <View style={[styles.adviceCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.adviceTitle, { color: colors.primary }]}>🧪 Kimyasal Tavsiyeler</Text>
              {result.disease.chemical_advice.map((advice: string, index: number) => (
                <Text key={index} style={[styles.adviceItem, { color: colors.textSecondary }]}>
                  • {advice}
                </Text>
              ))}
            </View>

            {/* Feedback Section */}
            <View style={[styles.feedbackCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.feedbackTitle, { color: colors.text }]}>
                Bu teşhis doğru muydu?
              </Text>

              {feedbackState === 'submitted' ? (
                <Text style={[styles.feedbackConfirmation, { color: colors.primary }]}>
                  {feedbackMessage}
                </Text>
              ) : showDiseaseSelector ? (
                <View style={styles.diseaseSelectorContainer}>
                  <Text style={[styles.diseaseSelectorLabel, { color: colors.textSecondary }]}>
                    Doğru hastalığı seçin:
                  </Text>
                  {ALL_DISEASES.map((disease) => (
                    <TouchableOpacity
                      key={disease.id}
                      style={[
                        styles.diseaseSelectorItem,
                        { borderColor: colors.border, backgroundColor: colors.background },
                      ]}
                      onPress={() => handleDiseaseSelect(disease.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${disease.name} seç`}
                      accessibilityHint="Doğru hastalık olarak işaretle"
                    >
                      <DiseaseIcon diseaseId={disease.id} size={24} style={styles.selectorIcon} accessibilityLabel={`${disease.name} ikonu`} />
                      <Text style={[styles.diseaseSelectorText, { color: colors.text }]}>
                        {disease.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.feedbackButtons}>
                  <TouchableOpacity
                    style={[styles.feedbackButtonYes, { backgroundColor: colors.primary }]}
                    onPress={handleFeedbackYes}
                    accessibilityRole="button"
                    accessibilityLabel="Evet, teşhis doğru"
                    accessibilityHint="Teşhisin doğru olduğunu onayla"
                  >
                    <Text style={styles.feedbackButtonYesText}>✓ Evet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.feedbackButtonNo, { borderColor: colors.error }]}
                    onPress={handleFeedbackNo}
                    accessibilityRole="button"
                    accessibilityLabel="Hayır, teşhis yanlış"
                    accessibilityHint="Doğru hastalığı seçmek için form aç"
                  >
                    <Text style={[styles.feedbackButtonNoText, { color: colors.error }]}>
                      ✗ Hayır
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { width: '100%', height: 300, resizeMode: 'cover' },
  noImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: { padding: 20 },
  resultContainer: { width: '100%' },
  resultTitle: {
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  diseaseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  diseaseIcon: {
    marginRight: 8,
  },
  diseaseName: {
    fontSize: 24,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  confidence: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  description: { fontSize: 16, lineHeight: 24, marginBottom: 20 },
  adviceCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  adviceTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  adviceItem: { fontSize: 15, lineHeight: 22, marginBottom: 5 },
  errorContainer: { padding: 20, borderRadius: 10 },
  errorText: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  errorSubText: { fontSize: 15 },

  // Feedback styles
  feedbackCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  feedbackButtonYes: {
    flex: 1,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackButtonYesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedbackButtonNo: {
    flex: 1,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  feedbackButtonNoText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedbackConfirmation: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
  diseaseSelectorContainer: {
    gap: 8,
  },
  diseaseSelectorLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  diseaseSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorIcon: {
    marginRight: 10,
  },
  diseaseSelectorText: {
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
});
