"use client";

import { useRef, useEffect, forwardRef, useState } from 'react';
import { useMediaStream } from '@/hooks/useMediaStream';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PrivacySettings {
  blurIntensity: number;
  detectionSensitivity: number;
  anonymizationMode: 'blur' | 'pixelate' | 'black-box';
}

interface ProcessingStats {
  facesDetected: number;
  processingTime: number;
  frameRate: number;
  isProcessing: boolean;
}

interface StreamViewerProps {
  videoSource: 'webcam' | 'file' | 'demo';
  selectedFile: File | null;
  isProcessing: boolean;
  privacySettings: PrivacySettings;
  onStatsUpdate: (stats: Partial<ProcessingStats>) => void;
}

export const StreamViewer = forwardRef<HTMLVideoElement, StreamViewerProps>(
  ({ videoSource, selectedFile, isProcessing, privacySettings, onStatsUpdate }, _ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    const { stream, startStream, stopStream, error: streamError } = useMediaStream();

    // Demo video placeholder URL
    const demoVideoUrl = "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/42b3b25f-83d0-401a-956b-8e3314e4718b.png";

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const setupVideoSource = async () => {
        setIsLoading(true);
        setError('');

        try {
          switch (videoSource) {
            case 'webcam':
              const webcamStream = await startStream({ video: true, audio: false });
              if (webcamStream) {
                video.srcObject = webcamStream;
                setHasPermission(true);
              }
              break;

            case 'file':
              if (selectedFile) {
                const fileURL = URL.createObjectURL(selectedFile);
                video.src = fileURL;
                video.load();
                
                // Store cleanup function for later use
                const cleanup = () => URL.revokeObjectURL(fileURL);
                return cleanup;
              }
              break;

            case 'demo':
              video.src = demoVideoUrl;
              video.load();
              break;
          }
        } catch (err) {
          console.error('Error setting up video source:', err);
          setError(`Failed to access ${videoSource}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setHasPermission(false);
        } finally {
          setIsLoading(false);
        }
      };

      setupVideoSource();

      return () => {
        if (videoSource === 'webcam') {
          stopStream();
        }
      };
    }, [videoSource, selectedFile, startStream, stopStream]);

    useEffect(() => {
      if (streamError) {
        setError(streamError);
        setHasPermission(false);
      }
    }, [streamError]);

    useEffect(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !isProcessing) return;

      let animationId: number;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const processFrame = () => {
        if (video.readyState >= 2) {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw current video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Simulate face detection and processing stats
          // In a real implementation, this would use actual face detection
          const simulatedFaces = Math.floor(Math.random() * 4);
          const processingTime = 15 + Math.random() * 10;
          
          onStatsUpdate({
            facesDetected: simulatedFaces,
            processingTime,
            frameRate: 30
          });

          // Apply simulated anonymization effect for demo
          if (simulatedFaces > 0) {
            // Draw simulated anonymization areas
            for (let i = 0; i < simulatedFaces; i++) {
              const x = Math.random() * (canvas.width - 100);
              const y = Math.random() * (canvas.height - 100);
              const width = 80 + Math.random() * 40;
              const height = 80 + Math.random() * 40;

              switch (privacySettings.anonymizationMode) {
                case 'blur':
                  ctx.filter = `blur(${Math.max(2, privacySettings.blurIntensity / 2)}px)`;
                  ctx.drawImage(canvas, x, y, width, height, x, y, width, height);
                  ctx.filter = 'none';
                  break;
                
                case 'pixelate':
                  const pixelSize = Math.max(8, privacySettings.blurIntensity);
                  const imageData = ctx.getImageData(x, y, width, height);
                  const data = imageData.data;
                  
                  for (let py = 0; py < height; py += pixelSize) {
                    for (let px = 0; px < width; px += pixelSize) {
                      const pixelX = Math.min(px, width - 1);
                      const pixelY = Math.min(py, height - 1);
                      const idx = (pixelY * width + pixelX) * 4;
                      
                      const r = data[idx];
                      const g = data[idx + 1];
                      const b = data[idx + 2];
                      
                      for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
                        for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
                          const fillIdx = ((py + dy) * width + (px + dx)) * 4;
                          data[fillIdx] = r;
                          data[fillIdx + 1] = g;
                          data[fillIdx + 2] = b;
                        }
                      }
                    }
                  }
                  
                  ctx.putImageData(imageData, x, y);
                  break;
                
                case 'black-box':
                  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                  ctx.fillRect(x, y, width, height);
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                  ctx.font = '12px Arial';
                  ctx.textAlign = 'center';
                  ctx.fillText('PRIVATE', x + width / 2, y + height / 2);
                  break;
              }
            }
          }
        }

        if (isProcessing) {
          animationId = requestAnimationFrame(processFrame);
        }
      };

      // Start processing loop
      processFrame();

      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }, [isProcessing, privacySettings, onStatsUpdate]);

    const requestCameraPermission = async () => {
      try {
        setIsLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          setError('');
        }
      } catch (err) {
        setError('Camera access denied. Please allow camera permissions and try again.');
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="relative w-full h-full">
        {error && (
          <Alert className="mb-4 border-red-500/20 bg-red-900/20">
            <AlertDescription className="text-red-400">
              {error}
              {videoSource === 'webcam' && hasPermission === false && (
                <Button 
                  size="sm" 
                  onClick={requestCameraPermission}
                  className="ml-2 bg-red-600 hover:bg-red-700"
                >
                  Grant Permission
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 backdrop-blur-sm">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3 mx-auto"></div>
              <div className="text-white">Loading {videoSource}...</div>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover bg-gray-900 ${isProcessing ? 'hidden' : 'block'}`}
          onLoadedMetadata={() => {
            if (videoSource !== 'webcam') {
              videoRef.current?.play();
            }
          }}
          onError={() => {
            setError(`Failed to load ${videoSource === 'demo' ? 'demo video' : videoSource}`);
          }}
        />

        <canvas
          ref={canvasRef}
          className={`w-full h-full object-cover bg-gray-900 ${isProcessing ? 'block' : 'hidden'}`}
        />

        {!stream && videoSource === 'webcam' && hasPermission === null && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 backdrop-blur-sm">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Camera Access Required</h3>
              <p className="text-gray-300 mb-4">Allow camera access to start face anonymization</p>
              <Button onClick={requestCameraPermission} className="bg-blue-600 hover:bg-blue-700">
                Enable Camera
              </Button>
            </div>
          </div>
        )}

        {videoSource === 'file' && !selectedFile && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 backdrop-blur-sm">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 14h14l-2-14M10 8v6M14 8v6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Video Selected</h3>
              <p className="text-gray-300">Choose a video file to begin anonymization</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

StreamViewer.displayName = 'StreamViewer';