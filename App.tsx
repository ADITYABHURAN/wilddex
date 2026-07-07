import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { User } from 'firebase/auth';
import { identifyAnimal, CatchResult } from './lib/identify';
import { saveCatchRemote, getAllCatchesRemote } from './lib/catchesApi';
import { onAuthChange, signOutUser } from './lib/auth';
import { getStreak, updateStreakOnCatch } from './lib/streaks';
import { getUserTotalXp, computeLevel } from './lib/userStats';
import { getGlobalCatchCount } from './lib/globalStats';
import { requestLocationPermission, getCurrentLocation } from './lib/location';
import { Rarity } from './data/species';
import DexScreen from './screens/DexScreen';
import AuthScreen from './screens/AuthScreen';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import MapScreen from './screens/MapScreen';

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#8b949e',
  uncommon: '#3fb950',
  rare: '#58a6ff',
  epic: '#a371f7',
  legendary: '#f0b429',
};

type Screen = 'camera' | 'dex' | 'map';

function SignOutButton({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity
      style={[styles.signOutIconButton, { top: insets.top + 12 }]}
      onPress={onPress}
    >
      <Text style={styles.signOutIconText}>🚪</Text>
    </TouchableOpacity>
  );
}

function ProfilePill({
  level,
  streak,
  onPress,
}: {
  level: number;
  streak: number | null;
  onPress: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity
      style={[styles.mapPill, styles.profilePill, { bottom: insets.bottom + 40 }]}
      onPress={onPress}
    >
      <Text style={styles.profilePillText}>
        Lv {level}
        {!!streak && ` • 🔥 ${streak}`}
      </Text>
    </TouchableOpacity>
  );
}

function BackButton({ onPress, label = '← Map' }: { onPress: () => void; label?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity style={[styles.backButton, { top: insets.top + 12 }]} onPress={onPress}>
      <Text style={styles.backButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('map');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [catchResult, setCatchResult] = useState<CatchResult | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [globalCatchCount, setGlobalCatchCount] = useState<number | null>(null);
  const [pendingOnboarding, setPendingOnboarding] = useState(false);
  const [hasCatches, setHasCatches] = useState<boolean | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

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
    if (!user) {
      setTotalXp(0);
      return;
    }
    getUserTotalXp(user.uid)
      .then(setTotalXp)
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Best-effort: if denied, catches still save fine without coordinates.
    requestLocationPermission().catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) {
      setHasCatches(null);
      return;
    }
    getAllCatchesRemote(user.uid)
      .then((catches) => setHasCatches(catches.length > 0))
      .catch(() => {});
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
    return <SplashScreen />;
  }

  if (!user) {
    return (
      <AuthScreen
        onAuthSuccess={(mode) => setPendingOnboarding(mode === 'signUp')}
      />
    );
  }

  if (pendingOnboarding) {
    return <OnboardingScreen onDone={() => setPendingOnboarding(false)} />;
  }

  if (screen === 'dex') {
    return (
      <SafeAreaView style={styles.container}>
        <DexScreen userId={user.uid} streak={streak} />
        <BackButton onPress={() => setScreen('map')} />
      </SafeAreaView>
    );
  }

  if (screen === 'map') {
    const { level } = computeLevel(totalXp);
    return (
      <SafeAreaView style={styles.container}>
        <MapScreen />
        <SignOutButton onPress={signOutUser} />
        <ProfilePill level={level} streak={streak} onPress={() => setScreen('dex')} />
        <View style={[styles.captureFabRow, { bottom: insets.bottom + 40 }]}>
          <TouchableOpacity style={styles.captureFabButton} onPress={() => setScreen('camera')}>
            <Text style={styles.fabIcon}>📷</Text>
          </TouchableOpacity>
        </View>
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
    setHasCatches(true);
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
    setScreen('map');
  };

  const handleCloseCameraFlow = () => {
    resetToCamera();
    setScreen('map');
  };

  if (catchResult) {
    const { species, xpEarned } = catchResult;
    return (
      <SafeAreaView style={styles.container}>
        <BackButton onPress={handleCloseCameraFlow} />
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
        <BackButton onPress={handleCloseCameraFlow} />
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
      <BackButton onPress={handleCloseCameraFlow} />
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      {hasCatches === false && (
        <View style={styles.hintContainer} pointerEvents="none">
          <Text style={styles.hintText}>Point at an animal and tap to catch it</Text>
        </View>
      )}
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
  hintContainer: { position: 'absolute', bottom: 160, width: '100%', alignItems: 'center', paddingHorizontal: 24 },
  hintText: {
    color: '#e6edf3',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(13,17,23,0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
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
  mapPill: {
    position: 'absolute',
    backgroundColor: 'rgba(13,17,23,0.75)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  profilePill: { left: 24 },
  profilePillText: { color: '#e6edf3', fontSize: 14, fontWeight: '700' },
  signOutIconButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13,17,23,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutIconText: { fontSize: 18 },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(13,17,23,0.75)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  backButtonText: { color: '#e6edf3', fontSize: 14, fontWeight: '600' },
  captureFabRow: { position: 'absolute', width: '100%', alignItems: 'center' },
  captureFabButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    borderWidth: 5,
    borderColor: '#4ade80',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabIcon: { fontSize: 28 },
});
