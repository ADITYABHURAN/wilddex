import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SLIDES = [
  {
    title: 'Catch real animals',
    body: 'Spot an animal in real life, snap a photo, and WildDex will identify it for you.',
  },
  {
    title: 'Build your Dex',
    body: 'Every catch joins your personal collection, complete with rarity tiers and XP.',
  },
  {
    title: 'Keep your streak alive',
    body: 'Catch something new each day to build your streak and level up over time.',
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.body}>{slide.body}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => (isLast ? onDone() : setIndex(index + 1))}
      >
        <Text style={styles.buttonText}>{isLast ? 'Get Started' : 'Next'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117', justifyContent: 'center', alignItems: 'center', padding: 32 },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#30363d' },
  dotActive: { backgroundColor: '#4ade80' },
  title: { color: '#e6edf3', fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  body: { color: '#8b949e', fontSize: 16, textAlign: 'center', lineHeight: 22, marginBottom: 48 },
  button: { backgroundColor: '#238636', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
