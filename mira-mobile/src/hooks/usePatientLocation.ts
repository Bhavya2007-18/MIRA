import { useEffect, useState, useCallback, useRef } from 'react';
import * as Location from 'expo-location';

const TRACKING_ENDPOINT = 'http://localhost:8000/api/v1/tracking/location';
const PING_INTERVAL_MS = 30000; // 30 seconds

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface UsePatientLocationReturn {
  location: LocationData | null;
  isTracking: boolean;
  lastPingTime: string | null;
  errorMsg: string | null;
  refreshLocation: () => Promise<void>;
}

export const usePatientLocation = (patientId: string = 'MIRA-8821'): UsePatientLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const patientIdRef = useRef<string>(patientId);
  useEffect(() => {
    patientIdRef.current = patientId;
  }, [patientId]);

  // Function to post GPS position to the FastAPI backend
  const postLocationPing = async (lat: number, lng: number) => {
    try {
      const response = await fetch(TRACKING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patientIdRef.current,
          lat,
          lng,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setLastPingTime(new Date().toLocaleTimeString());
      }
    } catch {
      // Backend may be offline; fail silently for seamless offline-first experience
    }
  };

  // Fetch current position and trigger ping
  const refreshLocation = useCallback(async () => {
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locData: LocationData = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      };

      setLocation(locData);
      await postLocationPing(locData.latitude, locData.longitude);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error obtaining GPS coordinates');
    }
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const initializeTracking = async () => {
      try {
        // Request foreground location permissions using expo-location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setIsTracking(false);
          return;
        }

        setIsTracking(true);
        setErrorMsg(null);

        // Immediate first reading
        await refreshLocation();

        // Set up recurring interval every 30 seconds
        intervalId = setInterval(() => {
          refreshLocation();
        }, PING_INTERVAL_MS);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to initialize location service');
        setIsTracking(false);
      }
    };

    initializeTracking();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refreshLocation]);

  return {
    location,
    isTracking,
    lastPingTime,
    errorMsg,
    refreshLocation,
  };
};

export default usePatientLocation;
