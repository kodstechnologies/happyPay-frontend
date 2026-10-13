export interface Coordinates {
  latitude: string;
  longitude: string;
}

export interface GeolocationOptions {
  fallbackLatitude?: string;
  fallbackLongitude?: string;
  timeout?: number;
}

const DEFAULT_FALLBACK_LATITUDE = "28.7041";
const DEFAULT_FALLBACK_LONGITUDE = "77.1025";
const DEFAULT_TIMEOUT_MS = 3000;

/**
 * Clean, reusable utility to safely retrieve current geolocation coordinates.
 * Returns default fallback coordinates if geolocation is unsupported, permission is denied, or it times out.
 */
export const getGeolocationCoordinates = async (
  options: GeolocationOptions = {}
): Promise<Coordinates> => {
  const {
    fallbackLatitude = DEFAULT_FALLBACK_LATITUDE,
    fallbackLongitude = DEFAULT_FALLBACK_LONGITUDE,
    timeout = DEFAULT_TIMEOUT_MS,
  } = options;

  return new Promise<Coordinates>((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ latitude: fallbackLatitude, longitude: fallbackLongitude });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        });
      },
      () => {
        resolve({ latitude: fallbackLatitude, longitude: fallbackLongitude });
      },
      { timeout, enableHighAccuracy: false }
    );
  });
};
