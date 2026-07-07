import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { User } from 'firebase/auth';
import { identifyAnimal, CatchResult } from './lib/identify';
import { saveCatchRemote } from './lib/catchesApi';
import { onAuthChange, signOutUser } from './lib/auth';
import { getStreak, updateStreakOnCatch } from './lib/streaks';
import { getGlobalCatchCount } from './lib/globalStats';
import { requestLocationPermission, getCurrentLocation } from './lib/location';
import { Rarity } from './data/species';
import DexScreen from './screens/DexScreen';
import AuthScreen from './screens/AuthScreen';

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#8b949e',
  uncommon: '#3fb950',
  rare: '#58a6ff',
  epic: '#a371f7',
  legendary: '#f0b429',
};

type Screen = 'camera' | 'dex';

function TabHeader({
  screen,
  setScreen,
  onSignOut,
  streak,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
  onSignOut: () => void;
  streak: number | null;
}) {
  return (
    <View style={styles.tabRow}>
      {!!streak && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakBadgeText}>🔥 {streak}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.tabButton, screen === 'camera' && styles.tabButtonActive]}
        onPress={() => setScreen('camera')}
      >
        <Text style={styles.tabButtonText}>Camera</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, screen === 'dex' && styles.tabButtonActive]}
        onPress={() => setScreen('dex')}
      >
        <Text style={styles.tabButtonText}>Dex</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('camera');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [catchResult, setCatchResult] = useState<CatchResult | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [globalCatchCount, setGlobalCatchCount] = useState<number | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((nextUser) => {
      setUser(nextUser);
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setStreak(null);
      return;
    }
    getStreak(user.uid)
      .then((info) => setStreak(info?.currentStreak ?? 0))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Best-effort: if denied, catches still save fine without coordinates.
    requestLocationPermission().catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!catchResult) {
      setGlobalCatchCount(null);
      return;
    }
    setGlobalCatchCount(null);
    getGlobalCatchCount(catchResult.species.id)
      .then(setGlobalCatchCount)
      .catch(() => {});
  }, [catchResult]);

  if (isAuthLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (screen === 'dex') {
    return (
      <SafeAreaView style={styles.container}>
        <TabHeader screen={screen} setScreen={setScreen} onSignOut={signOutUser} streak={streak} />
        <DexScreen userId={user.uid} />
      </SafeAreaView>
    );
  }

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

  const handleAddToDex = async () => {
    if (!catchResult || !user) return;
    console.log('Caught:', catchResult);
    const location = await getCurrentLocation();
    await saveCatchRemote(user.uid, catchResult, location);
    try {
      const { currentStreak, isNewRecord } = await updateStreakOnCatch(user.uid);
      setStreak(currentStreak);
      if (isNewRecord) {
        Alert.alert('🔥 New record!', `${currentStreak}-day streak`);
      }
    } catch {
      // Streak tracking is non-critical — don't block the catch flow on it.
    }
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
          {globalCatchCount !== null && (
            <Text style={styles.globalCountText}>
              {globalCatchCount === 0
                ? '🌍 Be the first to catch this this week!'
                : `🌍 ${globalCatchCount} ${globalCatchCount === 1 ? 'person' : 'people'} caught this in the last week`}
            </Text>
          )}
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
    <SafeAreaView style={styles.container}>
      <TabHeader screen={screen} setScreen={setScreen} onSignOut={signOutUser} streak={streak} />
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.shutterRow}>
        <TouchableOpacity style={styles.shutter} onPress={takePhoto} />
      </View>
    </SafeAreaView>
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
  globalCountText: { color: '#8b949e', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  tabRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8 },
  streakBadge: { paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  streakBadgeText: { color: '#f0b429', fontSize: 15, fontWeight: '700' },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d' },
  tabButtonActive: { backgroundColor: '#238636', borderColor: '#238636' },
  tabButtonText: { color: '#e6edf3', fontSize: 14, fontWeight: '600' },
  signOutButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  signOutButtonText: { color: '#f85149', fontSize: 13, fontWeight: '600' },
});
