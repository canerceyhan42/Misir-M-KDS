import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  if (!permission) {
    return <View />;
  }
  if (!permission.granted) {
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.text}>Kamera kullanım izni gerekiyor.</Text>
        <Button 
          onPress={requestPermission} 
          title="İzin Ver" 
          color="#2E7D32"
          accessibilityLabel="Kamera izni ver"
        />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
      });
      if (photo) {
        router.push({ pathname: '/result', params: { imageUri: photo.uri } });
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={takePicture}
            accessibilityLabel="Fotoğraf çek"
            accessibilityHint="Mısır yaprağının fotoğrafını çeker"
            accessibilityRole="button"
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { textAlign: 'center', marginBottom: 20, fontSize: 16 },
  camera: { flex: 1 },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
});
