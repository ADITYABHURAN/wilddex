import * as Location from 'expo-location';

export type Coordinates = { latitude: number; longitude: number };

const GET_LOCATION_TIMEOUT_MS = 5000;

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  } catch {
    return false;
  }
}

// Never throws — returns null if permission is missing, the device can't get
// a fix, or it takes too long, so a slow/denied GPS never blocks a catch.
export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) return null;

    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), GET_LOCATION_TIMEOUT_MS)),
    ]);
    if (!position) return null;

    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
}

// Continuous tracking for the live map (separate from the one-time catch-time
// fetch above). Never throws — returns null if permission is missing or
// watching fails to start; the caller decides what to show in that case.
export async function watchLocation(
  onUpdate: (coords: Coordinates) => void
): Promise<{ remove: () => void } | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) return null;

    const subscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 10 },
      (position) => {
        onUpdate({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      }
    );
    return subscription;
  } catch {
    return null;
  }
}
