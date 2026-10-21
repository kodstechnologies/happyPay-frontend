export interface Coordinates {
  latitude: string;
  longitude: string;
}

export interface GeolocationOptions {
  fallbackLatitude?: string;
  fallbackLongitude?: string;
  timeout?: number;
}

const CACHE_KEY = "hp_active_location_v1";
const DEFAULT_FALLBACK_LATITUDE = "28.7041";
const DEFAULT_FALLBACK_LONGITUDE = "77.1025";
const DEFAULT_TIMEOUT_MS = 8000;

let memoryCoords: Coordinates | null = null;

/**
 * Validates that a coordinate string/number is non-empty, numeric, and NOT zero.
 */
export const isValidCoordinate = (val?: string | number | null): boolean => {
  if (val === undefined || val === null) return false;
  const str = String(val).trim();
  if (str === "" || str === "0" || str === "0.0" || str === "NaN") return false;
  const num = Number(str);
  return !Number.isNaN(num) && num !== 0;
};

/**
 * Reads cached coordinates from memory or sessionStorage.
 */
export const getCachedCoordinates = (): Coordinates | null => {
  if (
    memoryCoords &&
    isValidCoordinate(memoryCoords.latitude) &&
    isValidCoordinate(memoryCoords.longitude)
  ) {
    return memoryCoords;
  }
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        isValidCoordinate(parsed?.latitude) &&
        isValidCoordinate(parsed?.longitude)
      ) {
        memoryCoords = parsed;
        return parsed;
      }
    }
  } catch {
    // sessionStorage not available or parsing failed
  }
  return null;
};

/**
 * Saves valid coordinates to memory and sessionStorage.
 */
export const setCachedCoordinates = (coords: Coordinates): void => {
  if (isValidCoordinate(coords.latitude) && isValidCoordinate(coords.longitude)) {
    memoryCoords = coords;
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(coords));
    } catch {
      // sessionStorage quota or security restriction
    }
  }
};

/**
 * Returns true if genuine coordinates are currently available in cache.
 */
export const hasValidCoordinates = (): boolean => {
  return getCachedCoordinates() !== null;
};

/**
 * 1. DASHBOARD INITIALIZER:
 * Requests browser location permission upfront on Dashboard mount.
 */
export const initDashboardLocation = async (): Promise<Coordinates | null> => {
  const existing = getCachedCoordinates();
  if (existing) return existing;
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        };
        if (isValidCoordinate(coords.latitude) && isValidCoordinate(coords.longitude)) {
          setCachedCoordinates(coords);
          resolve(coords);
        } else {
          resolve(null);
        }
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: DEFAULT_TIMEOUT_MS, maximumAge: 600000 }
    );
  });
};

/**
 * 2. AEPS ENTRY INITIALIZER:
 * Called on first entering the AePS service. If coordinates are missing, re-prompts immediately.
 */
export const initAepsLocation = async (): Promise<Coordinates | null> => {
  if (hasValidCoordinates()) {
    return getCachedCoordinates();
  }
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        };
        if (isValidCoordinate(coords.latitude) && isValidCoordinate(coords.longitude)) {
          setCachedCoordinates(coords);
          resolve(coords);
        } else {
          resolve(null);
        }
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: DEFAULT_TIMEOUT_MS, maximumAge: 0 }
    );
  });
};

/**
 * 3. TRANSACTION GATEKEEPER:
 * Before ANY AePS API is called:
 * - If genuine coordinates exist, returns them immediately (0ms delay).
 * - If missing, asks user for confirmation and prompts for browser location.
 * - UNTIL valid coordinates are received, this promise rejects.
 *   NO API CALL IS EVER EXECUTED WITHOUT ACTUAL COORDINATES.
 */
export const ensureConfirmedLocation = async (): Promise<Coordinates> => {
  const cached = getCachedCoordinates();
  if (cached && isValidCoordinate(cached.latitude) && isValidCoordinate(cached.longitude)) {
    return cached;
  }

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error(
      "Geolocation is not supported by your browser. Location access is mandatory to process AePS transactions."
    );
  }

  // Ask for confirmation if location wasn't already granted
  const userConfirmed = window.confirm(
    "📍 Location Access Required:\n\nNPCI and Bank regulations require your device location to process AePS transactions.\n\nPlease click OK to allow location access."
  );

  if (!userConfirmed) {
    throw new Error(
      "Transaction cancelled: Location permission is mandatory to process AePS transactions."
    );
  }

  return new Promise<Coordinates>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        };
        if (isValidCoordinate(coords.latitude) && isValidCoordinate(coords.longitude)) {
          setCachedCoordinates(coords);
          resolve(coords);
        } else {
          reject(
            new Error(
              "Unable to obtain valid GPS coordinates. Please check your device location settings."
            )
          );
        }
      },
      (error) => {
        let errorMsg = "Failed to obtain device location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg =
            "Location permission was denied. Please allow location in your browser settings to proceed with AePS transactions.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out. Please check device GPS and retry.";
        }
        reject(new Error(errorMsg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
};

/**
 * Backward-compatible helper for other services (DMT, CMS, UPI Cashpoint).
 * Returns cached coordinates if available, otherwise safely attempts location or returns fallback.
 */
export const getGeolocationCoordinates = async (
  options: GeolocationOptions = {}
): Promise<Coordinates> => {
  const cached = getCachedCoordinates();
  if (cached) return cached;

  const {
    fallbackLatitude = DEFAULT_FALLBACK_LATITUDE,
    fallbackLongitude = DEFAULT_FALLBACK_LONGITUDE,
    timeout = DEFAULT_TIMEOUT_MS,
  } = options;

  const resolvedFallbackLat = isValidCoordinate(fallbackLatitude)
    ? fallbackLatitude
    : DEFAULT_FALLBACK_LATITUDE;
  const resolvedFallbackLon = isValidCoordinate(fallbackLongitude)
    ? fallbackLongitude
    : DEFAULT_FALLBACK_LONGITUDE;

  return new Promise<Coordinates>((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ latitude: resolvedFallbackLat, longitude: resolvedFallbackLon });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = String(pos.coords.latitude);
        const lon = String(pos.coords.longitude);
        if (isValidCoordinate(lat) && isValidCoordinate(lon)) {
          const coords = { latitude: lat, longitude: lon };
          setCachedCoordinates(coords);
          resolve(coords);
        } else {
          resolve({ latitude: resolvedFallbackLat, longitude: resolvedFallbackLon });
        }
      },
      () => {
        resolve({ latitude: resolvedFallbackLat, longitude: resolvedFallbackLon });
      },
      { timeout, enableHighAccuracy: false }
    );
  });
};

