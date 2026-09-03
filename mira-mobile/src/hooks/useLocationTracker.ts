import { useEffect, useState, useRef, useCallback } from 'react';
import * as Location from 'expo-location';

// Physical machine local IPv4 address (accessible from physical device on local Wi-Fi / network)
export const LOCAL_IP = '192.168.0.100';
export const BACKEND_TRACKING_URL = `http://${LOCAL_IP}:8000/api/v1/tracking/location`;
export const TRACKING_INTERVAL_MS = 10000; // 10 seconds

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  timestamp?: number;
}

export interface UseLocationTrackerResult {
  location: LocationCoordinates | null;
  isTracking: boolean;
  errorMsg: string | null;
  lastPingTime: string | null;
  refreshLocation: () => Promise<void>;
}

export const useLocationTracker = (
  patientId: string = 'test_patient_1'
): UseLocationTrackerResult => {
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);

  const patientIdRef = useRef(patientId);
  useEffect(() => {
    patientIdRef.current = patientId;
  }, [patientId]);

  // POST real location to the backend
  const postLocation = useCallback(async (lat: number, lng: number) => {
    const timestamp = new Date().toISOString();
    const primaryId = patientIdRef.current || 'test_patient_1';

    try {
      await fetch(BACKEND_TRACKING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: primaryId,
          lat,
          lng,
          timestamp,
        }),
      });

      // Synchronize test_patient_1 as well if different ID
      if (primaryId !== 'test_patient_1') {
        fetch(BACKEND_TRACKING_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: 'test_patient_1',
            lat,
            lng,
            timestamp,
          }),
        }).catch(() => {});
      }

      setLastPingTime(new Date().toLocaleTimeString());
    } catch {
      // Graceful offline fallback
    }
  }, []);

  const fetchAndSendLocation = useCallback(async () => {
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: LocationCoordinates = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        altitude: pos.coords.altitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      };

      setLocation(coords);
      await postLocation(coords.latitude, coords.longitude);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error fetching GPS coordinates');
    }
  }, [postLocation]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let positionWatcher: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        // Request foreground location permissions on mount
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setIsTracking(false);
          return;
        }

        setIsTracking(true);
        setErrorMsg(null);

        // Immediate position read and post
        await fetchAndSendLocation();

        // 1. Watch position using Location.watchPositionAsync
        positionWatcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: TRACKING_INTERVAL_MS,
            distanceInterval: 1,
          },
          (newPos) => {
            const coords: LocationCoordinates = {
              latitude: newPos.coords.latitude,
              longitude: newPos.coords.longitude,
              accuracy: newPos.coords.accuracy,
              timestamp: newPos.timestamp,
            };
            setLocation(coords);
            postLocation(coords.latitude, coords.longitude);
          }
        );

        // 2. Continuous 10-second interval fallback to guarantee 10s updates
        intervalId = setInterval(() => {
          fetchAndSendLocation();
        }, TRACKING_INTERVAL_MS);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to start location tracking');
        setIsTracking(false);
      }
    };

    startTracking();

    return () => {
      if (positionWatcher) {
        positionWatcher.remove();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchAndSendLocation, postLocation]);

  return {
    location,
    isTracking,
    errorMsg,
    lastPingTime,
    refreshLocation: fetchAndSendLocation,
  };
};

export default useLocationTracker;
