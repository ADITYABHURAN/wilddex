import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>WildDex</Text>
      <Text style={styles.subtitle}>Catch it. Collect it.</Text>
      <ActivityIndicator size="large" color="#4ade80" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: '#e6edf3', fontSize: 40, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#8b949e', fontSize: 16, marginBottom: 32 },
  spinner: { marginTop: 8 },
});
