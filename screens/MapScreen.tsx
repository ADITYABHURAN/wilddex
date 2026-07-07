import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { requestLocationPermission, watchLocation, Coordinates } from '../lib/location';

// Neutral fallback shown only for the brief gap before the first GPS fix
// arrives — permission was almost always already granted earlier (catch-time
// GPS tagging), so this rarely stays visible for long.
const DEFAULT_REGION: Region = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 40,
  longitudeDelta: 40,
};

const CLOSE_DELTA = 0.01;

export default function MapScreen() {
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const mapRef = useRef<MapView>(null);
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;

    (async () => {
      const granted = await requestLocationPermission();
      if (cancelled) return;
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
      subscription = await watchLocation((next) => {
        if (!cancelled) setCoords(next);
      });
      if (cancelled) subscription?.remove();
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!coords || hasCenteredRef.current) return;
    hasCenteredRef.current = true;
    mapRef.current?.animateToRegion(
      { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: CLOSE_DELTA, longitudeDelta: CLOSE_DELTA },
      500
    );
  }, [coords]);

  if (permissionDenied) {
    return (
      <View style={styles.center}>
        <Text style={styles.messageText}>Enable location access to see the live map</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={DEFAULT_REGION}>
        {coords && <Marker coordinate={coords} title="You are here" />}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#0d1117' },
  messageText: { color: '#8b949e', fontSize: 15, textAlign: 'center' },
});
