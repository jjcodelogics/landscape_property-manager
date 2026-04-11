import { useEffect, useRef, useState } from 'react';

interface UserPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface UseUserLocationReturn {
  position: UserPosition | null;
  error: string | null;
  isLoading: boolean;
}

const POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 10000,
  timeout: 10000,
};

// Throttle updates to avoid excessive re-renders
const THROTTLE_MS = 2000;

export function useUserLocation(): UseUserLocationReturn {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      const now = Date.now();
      
      // Throttle updates
      if (now - lastUpdateRef.current < THROTTLE_MS) {
        return;
      }

      lastUpdateRef.current = now;
      
      setPosition({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      setError(null);
      setIsLoading(false);
    };

    const handleError = (err: GeolocationPositionError) => {
      setIsLoading(false);
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError('Location permission denied');
          break;
        case err.POSITION_UNAVAILABLE:
          setError('Location unavailable');
          break;
        case err.TIMEOUT:
          setError('Location request timed out');
          break;
        default:
          setError('Location not available');
      }
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      POSITION_OPTIONS
    );

    // Watch position for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      POSITION_OPTIONS
    );

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return { position, error, isLoading };
}
