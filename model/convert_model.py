import tensorflow as tf
import os

model_path = "model_5_hastalik_final.keras"
tflite_path = "model.tflite"

print(f"Keras modeli yükleniyor: {model_path}")
try:
    model = tf.keras.models.load_model(model_path)
    print("Model yüklendi. TFLite formatına dönüştürülüyor...")

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    # TFLite boyutunu küçültmek ve mobil cihazda daha hızlı çalışmasını sağlamak için optimizasyon 
    # converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()

    with open(tflite_path, "wb") as f:
        f.write(tflite_model)

    print(f"Başarılı! Model TFLite formatında kaydedildi: {tflite_path}")

except Exception as e:
    print(f"Hata oluştu: {e}")
