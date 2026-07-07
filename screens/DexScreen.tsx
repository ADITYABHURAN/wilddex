import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { SPECIES, Rarity } from '../data/species';
import { getCatchCountsBySpeciesRemote } from '../lib/catchesApi';

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#8b949e',
  uncommon: '#3fb950',
  rare: '#58a6ff',
  epic: '#a371f7',
  legendary: '#f0b429',
};

export default function DexScreen({ userId }: { userId: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getCatchCountsBySpeciesRemote(userId)
      .then((result) => {
        setCounts(result);
        setIsLoading(false);
      })
      .catch(() => {
        setError('Could not load your Dex. Check your connection and try again.');
        setIsLoading(false);
      });
  }, [userId]);

  const discoveredCount = Object.keys(counts).length;
  const missingSpecies = SPECIES.filter((species) => !counts[species.id]);

  let headerText: string;
  if (missingSpecies.length === 0) {
    headerText = `🎉 Full WildDex! All ${SPECIES.length} species discovered.`;
  } else if (missingSpecies.length <= 3) {
    const names = missingSpecies.map((species) => species.commonName).join(', ');
    headerText =
      missingSpecies.length === 1
        ? `${discoveredCount}/${SPECIES.length} — only the ${names} left!`
        : `${discoveredCount}/${SPECIES.length} — just need: ${names}`;
  } else {
    headerText = `${discoveredCount} / ${SPECIES.length} discovered`;
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{headerText}</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {SPECIES.map((species) => {
          const count = counts[species.id] ?? 0;
          const caught = count > 0;
          return (
            <View
              key={species.id}
              style={[
                styles.card,
                caught
                  ? { borderColor: RARITY_COLORS[species.rarity] }
                  : styles.cardLocked,
              ]}
            >
              {caught ? (
                <>
                  <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[species.rarity] }]} />
                  <Text style={styles.cardName}>{species.commonName}</Text>
                  {count > 1 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>x{count}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.cardLockedText}>???</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CARD_SIZE = '31%';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#0d1117' },
  errorText: { color: '#f85149', fontSize: 15, textAlign: 'center' },
  header: {
    color: '#e6edf3',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    width: CARD_SIZE,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#161b22',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
  },
  cardLocked: {
    borderColor: '#30363d',
  },
  cardLockedText: {
    color: '#484f58',
    fontSize: 20,
    fontWeight: '700',
  },
  rarityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 6,
  },
  cardName: {
    color: '#e6edf3',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#238636',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
