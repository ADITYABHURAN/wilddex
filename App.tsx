import { useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.center}><Text style={styles.text}>Loading…</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>WildDex needs camera access to catch animals.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (photo) setPhotoUri(photo.uri);
  };

  if (photoUri) {
    return (
      <SafeAreaView style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.preview} />
        <TouchableOpacity style={styles.button} onPress={() => setPhotoUri(null)}>
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
        {/* TODO: send photoUri to /identify endpoint */}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.shutterRow}>
        <TouchableOpacity style={styles.shutter} onPress={takePhoto} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#0d1117' },
  text: { color: '#e6edf3', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  camera: { flex: 1 },
  preview: { flex: 1, resizeMode: 'contain' },
  shutterRow: { position: 'absolute', bottom: 48, width: '100%', alignItems: 'center' },
  shutter: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#fff', borderWidth: 5, borderColor: '#4ade80' },
  button: { backgroundColor: '#238636', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10, alignSelf: 'center', margin: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});