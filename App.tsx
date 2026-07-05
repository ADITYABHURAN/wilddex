import { useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { identifyAnimal, CatchResult } from './lib/identify';
import { Rarity } from './data/species';

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#8b949e',
  uncommon: '#3fb950',
  rare: '#58a6ff',
  epic: '#a371f7',
  legendary: '#f0b429',
};

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [catchResult, setCatchResult] = useState<CatchResult | null>(null);
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

  const resetToCamera = () => {
    setPhotoUri(null);
    setCatchResult(null);
    setIsIdentifying(false);
  };

  const handleIdentify = async () => {
    if (!photoUri) return;
    setIsIdentifying(true);
    const result = await identifyAnimal(photoUri);
    setIsIdentifying(false);
    setCatchResult(result);
  };

  const handleAddToDex = () => {
    console.log('Caught:', catchResult);
    resetToCamera();
  };

  if (catchResult) {
    const { species, xpEarned } = catchResult;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLORS[species.rarity] }]}>
            <Text style={styles.rarityBadgeText}>{species.rarity.toUpperCase()}</Text>
          </View>
          <Text style={styles.commonName}>{species.commonName}</Text>
          <Text style={styles.scientificName}>{species.scientificName}</Text>
          <Text style={styles.xpText}>+{xpEarned} XP</Text>
          <TouchableOpacity style={styles.button} onPress={handleAddToDex}>
            <Text style={styles.buttonText}>Add to Dex</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={resetToCamera}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (photoUri) {
    return (
      <SafeAreaView style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.preview} />
        {isIdentifying ? (
          <View style={styles.identifyingRow}>
            <ActivityIndicator size="large" color="#4ade80" />
            <Text style={styles.text}>Identifying…</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={handleIdentify}>
              <Text style={styles.buttonText}>Identify</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={resetToCamera}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
          </>
        )}
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
  secondaryButton: { backgroundColor: '#30363d', marginTop: 0 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  identifyingRow: { position: 'absolute', bottom: 80, width: '100%', alignItems: 'center', gap: 12 },
  rarityBadge: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, marginBottom: 16 },
  rarityBadgeText: { color: '#0d1117', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  commonName: { color: '#e6edf3', fontSize: 26, fontWeight: '700', textAlign: 'center' },
  scientificName: { color: '#8b949e', fontSize: 16, fontStyle: 'italic', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  xpText: { color: '#4ade80', fontSize: 20, fontWeight: '600', marginBottom: 8 },
});
