/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, RefreshCw, AlertCircle, CheckCircle2, SwitchCamera, Zap } from 'lucide-react';

interface CameraQrScannerProps {
  onScanSuccess?: (scannedData: string) => void;
  onScan?: (scannedData: string) => void;
  onClose?: () => void;
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({
  onScanSuccess,
  onScan,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState(true);
  const [detected, setDetected] = useState(false);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);
    setDetected(false);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
        setHasCamera(true);
        setIsScanning(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setHasCamera(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser, or enter the join code manually.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device found on this phone/computer. Please enter code manually.');
      } else {
        setErrorMessage(err.message || 'Unable to access camera. Please enter code manually.');
      }
    }
  }, [facingMode, stopCamera]);

  const startScanningLoop = () => {
    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (qrCode && qrCode.data) {
            const rawData = qrCode.data.trim();
            setDetected(true);
            setIsScanning(false);

            // Optional haptic vibration
            if (navigator.vibrate) {
              try {
                navigator.vibrate(80);
              } catch {}
            }

            stopCamera();
            if (onScanSuccess) onScanSuccess(rawData);
            if (onScan) onScan(rawData);
            return;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(scan);
    };

    animFrameRef.current = requestAnimationFrame(scan);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col items-center">
      {/* Hidden offscreen canvas for frame processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Viewport Container */}
      <div className="relative w-full aspect-square max-w-[340px] overflow-hidden rounded-2xl bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scanning Target Finder UI Overlay */}
        {hasCamera && isScanning && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            <div className="relative w-56 h-56 border-2 border-cyan-400/80 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex items-center justify-center">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />

              {/* Animated Laser Scanning Line */}
              <div className="absolute top-0 left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce shadow-[0_0_8px_#22d3ee]" />

              <div className="text-[11px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40">
                Align QR inside box
              </div>
            </div>
          </div>
        )}

        {/* QR Detected Confirmation - No raw URL display */}
        {detected && (
          <div className="absolute inset-0 bg-emerald-950/95 flex flex-col items-center justify-center p-4 text-center animate-fadeIn z-20">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
            <div className="text-sm font-bold text-slate-100 font-mono tracking-wide">✓ QR CODE DETECTED</div>
            <div className="text-xs text-emerald-300/80 font-mono mt-1">Resolving Checkpoint...</div>
          </div>
        )}

        {/* Camera Loading State */}
        {hasCamera === null && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs font-mono p-4">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
            <span>Starting camera...</span>
          </div>
        )}

        {/* Camera Error / Permission Fallback */}
        {errorMessage && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
            <p className="text-xs text-rose-200 font-mono mb-4">{errorMessage}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Camera</span>
            </button>
          </div>
        )}
      </div>

      {/* Camera Controls Bar */}
      <div className="w-full p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px]">Live QR Scanner</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleCameraFacing}
            title="Switch Front/Rear Camera"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <SwitchCamera className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">Flip Camera</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
