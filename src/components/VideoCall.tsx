'use client';

import React, { useState, useEffect } from 'react';
import {
  Video,
  VideoOff,
  PhoneCall,
  ExternalLink,
  Shield,
  Volume2,
  Sparkles,
  Loader2,
  PhoneOff,
} from 'lucide-react';
import {
  initiateTelehealthCall,
  fetchCallStatus,
  endTelehealthCall,
} from '../lib/miraAiBridge';

interface VideoCallProps {
  patientId: string;
  patientName?: string;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  patientId,
  patientName = 'Patient',
}) => {
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Poll call status on mount to check if a call was already active
  useEffect(() => {
    async function checkExistingCall() {
      try {
        const status = await fetchCallStatus(patientId);
        if (status && status.is_calling && status.room_url) {
          setIsCalling(true);
          setRoomUrl(status.room_url);
        }
      } catch {
        // Fallback
      }
    }
    checkExistingCall();
  }, [patientId]);

  // Initiate call -> hits POST /api/v1/telehealth/call
  const handleStartCall = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = await initiateTelehealthCall(patientId);
      if (status && status.room_url) {
        setRoomUrl(status.room_url);
        setIsCalling(true);
      } else {
        // Fallback deterministic room URL
        const fallbackUrl = `https://meet.jit.si/mira-care-${patientId.trim().replace(/\s+/g, '-')}`;
        setRoomUrl(fallbackUrl);
        setIsCalling(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate video call.');
    } finally {
      setIsLoading(false);
    }
  };

  // End call -> hits POST /api/v1/telehealth/call/{patient_id}/end
  const handleEndCall = async () => {
    setIsLoading(true);
    try {
      await endTelehealthCall(patientId);
    } catch {
      // Best-effort
    } finally {
      setIsCalling(false);
      setRoomUrl(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cream-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition ${
            isCalling
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-sage-50 text-sage-700 border border-sage-200'
          }`}>
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-charcoal-900">Telehealth Video Signaling</h3>
            <p className="text-xs font-semibold text-charcoal-600">
              Encrypted Jitsi Meet video consult for {patientName}
            </p>
          </div>
        </div>

        {isCalling && (
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Call Active</span>
            </span>
            {roomUrl && (
              <a
                href={roomUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="p-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-charcoal-700 transition text-xs font-semibold flex items-center space-x-1"
                title="Open in new window"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Main Content: Either Call Initiation CTA or Embedded Jitsi Frame */}
      {isCalling && roomUrl ? (
        <div className="space-y-3 flex-1 flex flex-col">
          {/* Embedded Jitsi Video Frame */}
          <div className="relative w-full h-[400px] sm:h-[460px] rounded-2xl overflow-hidden border border-cream-300 shadow-inner bg-charcoal-950">
            <iframe
              src={roomUrl}
              title={`Jitsi Call - ${patientName}`}
              className="w-full h-full border-0"
              allow="camera; microphone; fullscreen; display-capture; autoplay"
            />
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-charcoal-600 font-semibold truncate max-w-[65%]">
              Room: <span className="text-sage-700 font-mono font-bold">{roomUrl.replace('https://', '')}</span>
            </div>

            <button
              onClick={handleEndCall}
              disabled={isLoading}
              className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center space-x-2 transition disabled:opacity-50"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-6 sm:p-8 bg-cream-50/70 border border-dashed border-cream-300 rounded-2xl space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-sage-50 border-2 border-sage-200 flex items-center justify-center text-sage-700 shadow-sm">
            <PhoneCall className="w-8 h-8 text-sage-600 animate-bounce" />
          </div>

          <div className="space-y-1.5 max-w-sm">
            <h4 className="text-base font-black text-charcoal-900">Direct Caregiver Video Uplink</h4>
            <p className="text-xs text-charcoal-600 font-medium leading-relaxed">
              Launch a secure, zero-touch video session. The patient&apos;s device will ring automatically with voice prompts in their regional language.
            </p>
          </div>

          {/* Key Capabilities Pills */}
          <div className="grid grid-cols-2 gap-2 text-left w-full max-w-xs text-[11px] font-semibold text-charcoal-700">
            <div className="bg-white border border-cream-200 p-2 rounded-xl flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-sage-600 shrink-0" />
              <span>E2E WebRTC</span>
            </div>
            <div className="bg-white border border-cream-200 p-2 rounded-xl flex items-center space-x-1.5">
              <Volume2 className="w-3.5 h-3.5 text-pastel-blue-700 shrink-0" />
              <span>Voice Auto-Answer</span>
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
              {error}
            </p>
          )}

          {/* Primary Action Button */}
          <button
            onClick={handleStartCall}
            disabled={isLoading}
            className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-sage-600 hover:bg-sage-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2.5 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting Signaling...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>Initiate Video Call with Patient</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
