"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useFaceDetection } from '@/hooks/useFaceDetection';

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

interface VideoProcessorProps {
  isActive: boolean;
  privacySettings: PrivacySettings;
  onStatsUpdate: (stats: Partial<ProcessingStats>) => void;
}

export function VideoProcessor({ isActive, privacySettings, onStatsUpdate }: VideoProcessorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef<boolean>(false);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const { detectFaces, isModelLoaded } = useFaceDetection();

  const applyAnonymization = useCallback((
    ctx: CanvasRenderingContext2D,
    face: { x: number; y: number; width: number; height: number },
    mode: string,
    intensity: number
  ) => {
    const { x, y, width, height } = face;
    
    switch (mode) {
      case 'blur':
        // Apply blur effect
        ctx.filter = `blur(${Math.max(2, intensity / 2)}px)`;
        ctx.drawImage(ctx.canvas, x, y, width, height, x, y, width, height);
        ctx.filter = 'none';
        break;
        
      case 'pixelate':
        // Pixelate effect
        const pixelSize = Math.max(8, intensity);
        const imageData = ctx.getImageData(x, y, width, height);
        const data = imageData.data;
        
        for (let py = 0; py < height; py += pixelSize) {
          for (let px = 0; px < width; px += pixelSize) {
            const pixelX = Math.min(px, width - 1);
            const pixelY = Math.min(py, height - 1);
            const i = (pixelY * width + pixelX) * 4;
            
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Fill pixel block with average color
            for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
              for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
                const idx = ((py + dy) * width + (px + dx)) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
              }
            }
          }
        }
        
        ctx.putImageData(imageData, x, y);
        break;
        
      case 'black-box':
        // Simple black box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(x, y, width, height);
        
        // Add privacy icon or text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PRIVATE', x + width / 2, y + height / 2);
        break;
    }
  }, []);

  const processFrame = useCallback(async (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) => {
    if (!isActive || processingRef.current || !isModelLoaded) return;
    
    processingRef.current = true;
    const startTime = performance.now();
    
    try {
      // Draw video frame to canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Detect faces
      const faces = await detectFaces(canvas);
      
      // Apply anonymization to detected faces
      faces.forEach(face => {
        const faceBox = {
          x: face.x * canvas.width,
          y: face.y * canvas.height,
          width: face.width * canvas.width,
          height: face.height * canvas.height
        };
        
        // Only process faces above confidence threshold
        if (face.confidence >= privacySettings.detectionSensitivity) {
          applyAnonymization(
            ctx,
            faceBox,
            privacySettings.anonymizationMode,
            privacySettings.blurIntensity
          );
        }
      });
      
      // Update statistics
      const processingTime = performance.now() - startTime;
      frameCountRef.current++;
      
      const now = performance.now();
      if (now - lastTimeRef.current >= 1000) {
        const fps = (frameCountRef.current * 1000) / (now - lastTimeRef.current);
        onStatsUpdate({
          facesDetected: faces.length,
          processingTime,
          frameRate: fps
        });
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
    } catch (error) {
      console.error('Error processing frame:', error);
    } finally {
      processingRef.current = false;
    }
  }, [isActive, isModelLoaded, detectFaces, privacySettings, applyAnonymization, onStatsUpdate]);

  const startProcessing = useCallback((video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const processLoop = () => {
      if (isActive && video.readyState >= 2) {
        processFrame(video, canvas, ctx);
      }
      
      if (isActive) {
        requestAnimationFrame(processLoop);
      }
    };
    
    requestAnimationFrame(processLoop);
  }, [isActive, processFrame]);

  useEffect(() => {
    if (!isActive) {
      processingRef.current = false;
      frameCountRef.current = 0;
      lastTimeRef.current = 0;
    }
  }, [isActive]);

  // Expose canvas for external video elements to use
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Make canvas available globally for other components
      (window as any).faceProcessingCanvas = canvas;
      (window as any).startFaceProcessing = startProcessing;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).faceProcessingCanvas;
        delete (window as any).startFaceProcessing;
      }
    };
  }, [startProcessing]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'none' }}
      className="hidden"
    />
  );
}