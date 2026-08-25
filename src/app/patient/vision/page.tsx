'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Volume2, Camera, CameraOff, Sparkles, CheckCircle2, MapPin, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_MIRA_API_URL || 'http://127.0.0.1:8000';

const ENROLLED_PERSONS = [
  {
    id: 'priya',
    name: 'Priya Hazarika',
    relation: 'Daughter',
    coreMemory: 'She studied at Cotton University and works as a teacher in Guwahati. She visits every Sunday with sweets.',
    location: 'Guwahati, Assam',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'rohan',
    name: 'Rohan Sangma',
    relation: 'Grandson',
    coreMemory: 'He is studying engineering in Shillong. He loves cricket and calls every evening at 7pm.',
    location: 'Shillong, Meghalaya',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'lalrinmawii',
    name: 'Lalrinmawii',
    relation: 'Wife',
    coreMemory: 'She makes the best bamboo shoot pickle. They met at the Aizawl cathedral fair in 1978.',
    location: 'Aizawl, Mizoram',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
  },
];

export default function VisionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const person = ENROLLED_PERSONS[selectedIndex];

  // Check model status on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/v1/vision/status`)
      .then(r => r.json())
      .then(setModelStatus)
      .catch(() => {});
  }, []);

  // Attach stream to video element whenever it changes
  useEffect(() => {
    const video = videoRef.current;
    if (video && streamRef.current) {
      video.srcObject = streamRef.current;
      video.play().catch(() => {});
    }
  }, [cameraActive]);

  const startCamera = useCallback(async () => {
    if (cameraLoading) return;
    setCameraLoading(true);
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      // Attach directly to video element if it exists
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setCameraActive(true);
      setError('');
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err?.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err?.name === 'NotFoundError') {
        setError('No camera found. Please connect a webcam.');
      } else if (err?.name === 'NotReadableError') {
        setError('Camera is being used by another app. Close other camera apps and try again.');
      } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setError('Camera requires HTTPS. Please use https:// or localhost.');
      } else {
        setError(`Camera error: ${err?.message || 'Unknown'}`);
      }
    } finally {
      setCameraLoading(false);
    }
  }, [cameraLoading]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const captureFrame = useCallback((): number[][][] | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const frame: number[][][] = [];
    for (let y = 0; y < canvas.height; y++) {
      const row: number[][] = [];
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        row.push([imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]]);
      }
      frame.push(row);
    }
    return frame;
  }, []);

  const handleScan = useCallback(async () => {
    if (!cameraActive) {
      setIsScanning(true);
      setScanResult(null);
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/vision/face/recognize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: 'MIRA-8821', image: [[], []] }),
        });
        const data = await res.json();
        setScanResult({
          ...data,
          status: 'demo',
          identity_id: person.id,
          identity_label: person.name,
          confidence: 0.994,
        });
      } catch {
        setScanResult({
          status: 'demo',
          identity_id: person.id,
          identity_label: person.name,
          confidence: 0.994,
        });
      }
      setIsScanning(false);
      return;
    }

    const frame = captureFrame();
    if (!frame) {
      setError('Failed to capture frame. Is the camera running?');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/vision/face/recognize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: 'MIRA-8821', image: frame }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch {
      setError('Backend unavailable. Running in offline mode.');
      setScanResult({
        status: 'offline',
        identity_id: person.id,
        identity_label: person.name,
        confidence: 0.0,
      });
    }

    setIsScanning(false);
  }, [cameraActive, captureFrame, person]);

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        `This is ${person.name}, ${person.relation}. ${person.coreMemory}`
      );
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const handleNext = () => {
    setSelectedIndex(prev => (prev + 1) % ENROLLED_PERSONS.length);
    setScanResult(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Camera Viewport */}
      <div className="relative rounded-3xl overflow-hidden bg-charcoal-900 aspect-[3/4] sm:aspect-video">
        {/* Video always mounted, hidden when camera off */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            cameraActive ? 'opacity-100' : 'opacity-0 absolute inset-0'
          }`}
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Fallback photo when camera is off */}
        {!cameraActive && (
          <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
        )}

        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-0 bg-charcoal-900/20 pointer-events-none" />

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
          <Link href="/patient" className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl border border-cream-200">
            <ArrowLeft className="w-5 h-5 text-charcoal-900" />
            <span className="text-sm font-bold text-charcoal-900">Home</span>
          </Link>
          <div className="flex items-center space-x-2 bg-pastel-blue-50/90 backdrop-blur-sm px-4 py-2 rounded-2xl border border-pastel-blue-200">
            <Sparkles className="w-4 h-4 text-pastel-blue-700" />
            <span className="text-xs font-black text-pastel-blue-700">
              {scanResult?.status === 'known' ? 'Identified!' : 'AI Vision Active'}
            </span>
          </div>
        </div>

        {/* Scanning animation */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pb-20 z-10">
            <div className="w-48 h-56 sm:w-56 sm:h-64 border-2 border-amber-400 rounded-2xl bg-amber-50/10 animate-pulse flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
            </div>
          </div>
        )}

        {/* Bounding box on recognized face */}
        {scanResult?.status === 'known' && scanResult?.bounding_box && cameraActive && (
          <div
            className="absolute border-2 border-sage-400 rounded-2xl bg-sage-50/10 z-10"
            style={{
              left: `${scanResult.bounding_box.x * 100}%`,
              top: `${scanResult.bounding_box.y * 100}%`,
              width: `${scanResult.bounding_box.width * 100}%`,
              height: `${scanResult.bounding_box.height * 100}%`,
            }}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center space-x-1 bg-sage-50 border border-sage-300 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-sage-600" />
              <span className="text-xs font-black text-sage-700">{Math.round((scanResult.confidence || 0) * 100)}% Match</span>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center space-x-3 z-10">
          <button
            onClick={cameraActive ? stopCamera : startCamera}
            disabled={cameraLoading}
            className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm border border-cream-200 px-4 py-2 rounded-2xl disabled:opacity-50"
          >
            {cameraLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : cameraActive ? (
              <CameraOff className="w-4 h-4" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            <span className="text-sm font-bold">
              {cameraLoading ? 'Starting...' : cameraActive ? 'Stop' : 'Start Camera'}
            </span>
          </button>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center space-x-2 bg-sage-500 hover:bg-sage-600 text-white px-4 py-2 rounded-2xl font-bold disabled:opacity-50"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isScanning ? 'Scanning...' : 'Scan Face'}</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center space-x-2 bg-sage-50/90 backdrop-blur-sm border border-sage-300 px-4 py-2 rounded-2xl"
          >
            <span className="text-sm font-bold text-charcoal-800">Next ({selectedIndex + 1}/{ENROLLED_PERSONS.length})</span>
          </button>
        </div>
      </div>

      {/* Model Status */}
      {modelStatus && (
        <div className="flex items-center justify-center space-x-4 text-xs font-bold text-charcoal-600">
          <span className={modelStatus.face_detector ? 'text-sage-600' : 'text-gentle-pink-600'}>
            Detector: {modelStatus.face_detector ? 'Loaded' : 'Fallback'}
          </span>
          <span className={modelStatus.face_embedder ? 'text-sage-600' : 'text-gentle-pink-600'}>
            Embedder: {modelStatus.face_embedder ? 'ONNX' : 'Histogram'}
          </span>
          <span>Faces enrolled: {modelStatus.enrolled_faces}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-gentle-pink-50 border border-gentle-pink-200 rounded-2xl p-3 text-sm text-gentle-pink-700 font-bold text-center">
          {error}
        </div>
      )}

      {/* Identification Bottom Sheet */}
      <div className="bg-cream-50 border border-cream-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <img src={person.photoUrl} alt={person.name} className="w-16 h-16 rounded-full border-2 border-sage-400 object-cover" />
            {scanResult?.status === 'known' && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                <CheckCircle2 className="w-5 h-5 text-sage-500" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-charcoal-900">
              {scanResult?.status === 'known' && scanResult.identity_label
                ? scanResult.identity_label
                : person.name}
            </h2>
            <span className="inline-block bg-pastel-blue-50 border border-pastel-blue-200 text-pastel-blue-700 text-sm font-bold px-3 py-0.5 rounded-xl mt-1">
              {person.relation}
            </span>
            {person.location && (
              <p className="flex items-center space-x-1 text-xs text-sage-700 font-semibold mt-1">
                <MapPin className="w-3 h-3" />
                <span>{person.location}</span>
              </p>
            )}
          </div>
        </div>

        {/* Core Memory */}
        <div className="bg-sage-50 border border-sage-200 rounded-2xl p-4 mb-4">
          <p className="text-xs font-black text-sage-700 uppercase tracking-wide mb-1">Core Memory</p>
          <p className="text-sm text-charcoal-800 font-semibold">&ldquo;{person.coreMemory}&rdquo;</p>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className={`rounded-2xl p-3 mb-4 text-sm font-bold ${
            scanResult.status === 'known'
              ? 'bg-sage-50 border border-sage-300 text-sage-800'
              : scanResult.status === 'demo'
              ? 'bg-pastel-blue-50 border border-pastel-blue-200 text-pastel-blue-800'
              : 'bg-amber-50 border border-amber-300 text-amber-800'
          }`}>
            {scanResult.status === 'known' && `Face identified as ${scanResult.identity_label} (${Math.round((scanResult.confidence || 0) * 100)}% confidence)`}
            {scanResult.status === 'demo' && `Demo mode — showing ${scanResult.identity_label}`}
            {scanResult.status === 'unknown' && 'Face not recognized. Try enrolling this person.'}
            {scanResult.status === 'no_face' && 'No face detected. Point the camera at a person.'}
            {scanResult.status === 'offline' && 'Running offline — no backend connection.'}
            {scanResult.inference_time_ms && (
              <span className="block text-xs opacity-70 mt-1">
                Inference: {scanResult.inference_time_ms.toFixed(0)}ms | Faces: {scanResult.faces_detected || 0}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleSpeak}
            className="flex-[2] flex items-center justify-center space-x-2 bg-sage-500 hover:bg-sage-600 text-white font-black py-3 rounded-2xl transition-colors"
          >
            <Volume2 className="w-5 h-5" />
            <span>Speak Aloud</span>
          </button>
          <Link
            href="/patient"
            className="flex-1 flex items-center justify-center space-x-2 bg-sage-50 hover:bg-sage-100 text-charcoal-800 font-bold py-3 rounded-2xl border border-sage-200 transition-colors"
          >
            <span>Done</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
