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
