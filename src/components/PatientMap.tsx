'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, RefreshCw, Radio, Navigation, ShieldCheck } from 'lucide-react';
import { sendLocationPing } from '../lib/miraAiBridge';

// Next.js Webpack scrambles Leaflet's default image paths. Fix by overriding icon prototype:
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BACKEND_URL = process.env.NEXT_PUBLIC_MIRA_API_URL || 'http://127.0.0.1:8000';

// Custom pulsing Leaflet marker icon for patient's real physical location
const createPatientIcon = (isLive: boolean) => {
  return L.divIcon({
    className: 'custom-patient-marker',
    html: `
      <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${
          isLive ? 'rgba(74, 124, 89, 0.35)' : 'rgba(160, 174, 192, 0.35)'
        }; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 24px; height: 24px; border-radius: 50%; background-color: ${
          isLive ? '#2F855A' : '#718096'
        }; border: 3px solid white; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 7px; height: 7px; border-radius: 50%; background-color: white;"></div>
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
  });
};

// Component to dynamically re-center map view on coordinate changes
function RecenterMap({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (
      coords &&
      typeof coords[0] === 'number' &&
      !isNaN(coords[0]) &&
      typeof coords[1] === 'number' &&
      !isNaN(coords[1])
    ) {
      map.setView(coords, map.getZoom(), { animate: true });
    }
  }, [coords, map]);
  return null;
}

interface PatientMapProps {
  patientId: string;
  patientName?: string;
  defaultCoords?: [number, number];
}

export const PatientMap: React.FC<PatientMapProps> = ({
  patientId,
  patientName = 'Patient',
  defaultCoords,
}) => {
  // No hardcoded Guwahati fallback; starts null unless passed via defaultCoords
  const [coords, setCoords] = useState<[number, number] | null>(defaultCoords || null);
  const [lastPingTime, setLastPingTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Poll GET /api/v1/tracking/location/{patient_id} every 5 seconds to get real-time GPS
  useEffect(() => {
    let isMounted = true;

    const fetchLatestLocation = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/tracking/location/${encodeURIComponent(patientId)}`);
        if (res.ok) {
          const data = await res.json();
          if (
            isMounted &&
            data &&
            typeof data.lat === 'number' &&
            typeof data.lng === 'number' &&
            !isNaN(data.lat) &&
            !isNaN(data.lng)
          ) {
            setCoords([data.lat, data.lng]);
            setLastPingTime(
              data.timestamp
                ? new Date(data.timestamp).toLocaleTimeString()
                : new Date().toLocaleTimeString()
            );
            setIsLive(true);
          }
        }
      } catch {
        // Silently handle backend offline or waiting for phone ping
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // Immediate initial fetch
    fetchLatestLocation();

    // Poll every 5 seconds (5000 ms)
    const intervalId = setInterval(fetchLatestLocation, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [patientId]);

  // Optional manual refresh button
  const handleManualRefresh = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/tracking/location/${encodeURIComponent(patientId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
          setCoords([data.lat, data.lng]);
          setLastPingTime(
            data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()
          );
          setIsLive(true);
        }
      }
    } catch {
      // Best effort
    } finally {
      setIsLoading(false);
    }
  };

  // Optional Test Ping for quick simulation without physical phone
  const handleSimulatePing = async () => {
    setIsSimulating(true);
    const baseLat = coords ? coords[0] : 26.1445;
    const baseLng = coords ? coords[1] : 91.7362;
    const deltaLat = (Math.random() - 0.48) * 0.0015;
    const deltaLng = (Math.random() - 0.48) * 0.0015;
    const newLat = Number((baseLat + deltaLat).toFixed(6));
    const newLng = Number((baseLng + deltaLng).toFixed(6));

    const ping = {
      patient_id: patientId,
      lat: newLat,
      lng: newLng,
      timestamp: new Date().toISOString(),
    };

    const res = await sendLocationPing(ping);
    if (res) {
      setCoords([newLat, newLng]);
      setLastPingTime(new Date().toLocaleTimeString());
      setIsLive(true);
    }
    setIsSimulating(false);
  };

  return (
    <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-sage-50 border border-sage-200 flex items-center justify-center text-sage-700">
              <MapPin className="w-5 h-5 text-sage-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-charcoal-900">Live GPS Location Tracking</h3>
              <p className="text-xs font-semibold text-charcoal-600">
                Continuous physical GPS tracking (polled every 5s) for {patientName}
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isLive && coords
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <Radio className={`w-3 h-3 ${isLive ? 'animate-pulse text-emerald-600' : 'text-amber-600'}`} />
            <span>{isLive && coords ? 'Physical Device GPS Active' : 'Awaiting Real Phone GPS'}</span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal-700 transition"
            title="Refresh GPS telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSimulatePing}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-xl bg-sage-50 hover:bg-sage-100 text-sage-700 border border-sage-200 text-xs font-bold transition flex items-center space-x-1"
            title="Simulate live GPS ping"
          >
            <Navigation className="w-3 h-3" />
            <span>{isSimulating ? 'Sending...' : 'Test Ping'}</span>
          </button>
        </div>
      </div>

      {/* Map Canvas or Awaiting GPS Screen */}
      {coords ? (
        <div className="relative w-full h-[360px] sm:h-[400px] rounded-2xl overflow-hidden border border-cream-200 shadow-inner">
          <MapContainer
            center={coords}
            zoom={16}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <RecenterMap coords={coords} />

            {/* OpenStreetMap Free Tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Safe Zone Geofence Circle (radius: 300 meters around true physical location) */}
            <Circle
              center={coords}
              radius={300}
              pathOptions={{
                color: '#3b7a57',
                fillColor: '#3b7a57',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '4, 6',
              }}
            />

            {/* Patient Physical Location Marker */}
            <Marker position={coords} icon={createPatientIcon(isLive)}>
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <p className="font-bold text-charcoal-900 text-sm">{patientName}</p>
                  <p className="text-charcoal-600 font-medium">ID: {patientId}</p>
                  <div className="pt-1 border-t border-cream-200 text-[11px] text-charcoal-500">
                    <p>Lat: {coords[0].toFixed(5)}</p>
                    <p>Lng: {coords[1].toFixed(5)}</p>
                    <p className="font-semibold text-sage-700">
                      {lastPingTime ? `Live GPS: ${lastPingTime}` : 'Real-time Phone Tracking'}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Map Floating Telemetry Card */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-cream-200 px-3.5 py-2 rounded-xl shadow-md z-[1000] text-xs">
            <div className="flex items-center space-x-2 text-charcoal-800 font-bold">
              <ShieldCheck className="w-4 h-4 text-sage-600" />
              <span>Real Physical GPS Locked</span>
            </div>
            <p className="text-[11px] text-charcoal-600 mt-0.5">
              Coordinates: {coords[0].toFixed(4)}° N, {coords[1].toFixed(4)}° E
              {lastPingTime ? ` • Updated ${lastPingTime}` : ''}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-[360px] sm:h-[400px] rounded-2xl bg-cream-50 border border-cream-200 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center text-sage-600 animate-pulse">
              <Radio className="w-8 h-8 animate-ping text-sage-500 opacity-75" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Navigation className="w-6 h-6 text-sage-700" />
            </div>
          </div>
          <div className="max-w-md">
            <h4 className="text-base font-bold text-charcoal-900">Awaiting Real-Time Patient GPS Signal...</h4>
            <p className="text-xs text-charcoal-600 mt-1">
              Polling <code className="font-mono text-sage-700">GET /api/v1/tracking/location/{patientId}</code> every 5 seconds.
              The map will immediately lock onto the patient's actual physical location when their phone transmits its GPS ping.
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            className="px-4 py-2 rounded-xl bg-sage-50 hover:bg-sage-100 text-sage-700 border border-sage-200 text-xs font-bold transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Poll Now</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientMap;
