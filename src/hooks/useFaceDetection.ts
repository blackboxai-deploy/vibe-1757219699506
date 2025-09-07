"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  DetectedFace, 
  FaceDetectionOptions, 
  initializeFaceDetection, 
  detectFacesInImage, 
  isFaceDetectionReady,
  faceDetectionCache 
} from '@/lib/faceDetection';

interface UseFaceDetectionReturn {
  detectFaces: (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => Promise<DetectedFace[]>;
  isModelLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  reinitialize: () => Promise<void>;
}

export function useFaceDetection(options?: Partial<FaceDetectionOptions>): UseFaceDetectionReturn {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await initializeFaceDetection();
      if (success) {
        setIsModelLoaded(true);
        setError(null);
      } else {
        setError('Failed to initialize face detection model');
        setIsModelLoaded(false);
      }
    } catch (err) {
      console.error('Face detection initialization error:', err);
      setError(err instanceof Error ? err.message : 'Unknown initialization error');
      setIsModelLoaded(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const detectFaces = useCallback(async (
    imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ): Promise<DetectedFace[]> => {
    if (!isModelLoaded) {
      console.warn('Face detection model not loaded yet');
      return [];
    }

    try {
      // Generate cache key based on element properties
      const cacheKey = generateCacheKey(imageElement);
      
      // Check cache first for performance
      const cachedResult = faceDetectionCache.getCachedResult(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Perform face detection
      const faces = await detectFacesInImage(imageElement, options);
      
      // Cache the result
      faceDetectionCache.setCachedResult(cacheKey, faces);
      
      return faces;
    } catch (err) {
      console.error('Face detection error:', err);
      setError(err instanceof Error ? err.message : 'Face detection failed');
      return [];
    }
  }, [isModelLoaded, options]);

  const reinitialize = useCallback(async () => {
    setIsModelLoaded(false);
    faceDetectionCache.clear();
    await initialize();
  }, [initialize]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Periodic health check
  useEffect(() => {
    if (isModelLoaded) {
      const healthCheckInterval = setInterval(() => {
        if (!isFaceDetectionReady()) {
          console.warn('Face detection model became unavailable, reinitializing...');
          reinitialize();
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(healthCheckInterval);
    }
  }, [isModelLoaded, reinitialize]);

  return {
    detectFaces,
    isModelLoaded,
    isLoading,
    error,
    reinitialize
  };
}

// Helper function to generate cache keys
function generateCacheKey(element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): string {
  const timestamp = Math.floor(Date.now() / 100); // 100ms resolution for caching
  
  if (element instanceof HTMLVideoElement) {
    return `video_${element.videoWidth}x${element.videoHeight}_${timestamp}`;
  } else if (element instanceof HTMLCanvasElement) {
    return `canvas_${element.width}x${element.height}_${timestamp}`;
  } else if (element instanceof HTMLImageElement) {
    return `image_${element.naturalWidth}x${element.naturalHeight}_${element.src.slice(-20)}`;
  } else {
    return `element_${timestamp}`;
  }
}

// Advanced face detection hook with additional features
export function useAdvancedFaceDetection(options?: {
  enableTracking?: boolean;
  trackingThreshold?: number;
  maxTrackingFrames?: number;
}) {
  const basicDetection = useFaceDetection();
  const [trackedFaces, setTrackedFaces] = useState<Map<string, DetectedFace & { trackingId: string; frameCount: number }>>(new Map());

  const detectAndTrack = useCallback(async (
    imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ): Promise<(DetectedFace & { trackingId?: string })[]> => {
    const faces = await basicDetection.detectFaces(imageElement);
    
    if (!options?.enableTracking) {
      return faces;
    }

    const threshold = options.trackingThreshold || 0.3;
    const maxFrames = options.maxTrackingFrames || 30;
    const currentTime = Date.now();
    
    // Update tracked faces
    const newTrackedFaces = new Map(trackedFaces);
    const trackedResults: (DetectedFace & { trackingId?: string })[] = [];

    faces.forEach(face => {
      let bestMatch: { id: string; distance: number } | null = null;

      // Find closest tracked face
      for (const [trackingId, trackedFace] of newTrackedFaces.entries()) {
        const distance = Math.sqrt(
          Math.pow(face.x - trackedFace.x, 2) + 
          Math.pow(face.y - trackedFace.y, 2)
        );

        if (distance < threshold && (!bestMatch || distance < bestMatch.distance)) {
          bestMatch = { id: trackingId, distance };
        }
      }

      if (bestMatch) {
        // Update existing tracked face
        const tracked = newTrackedFaces.get(bestMatch.id);
        if (tracked) {
          newTrackedFaces.set(bestMatch.id, {
            ...face,
            trackingId: bestMatch.id,
            frameCount: tracked.frameCount + 1
          });
          trackedResults.push({ ...face, trackingId: bestMatch.id });
        }
      } else {
        // Create new tracked face
        const newId = `face_${currentTime}_${Math.random().toString(36).substr(2, 9)}`;
        newTrackedFaces.set(newId, {
          ...face,
          trackingId: newId,
          frameCount: 1
        });
        trackedResults.push({ ...face, trackingId: newId });
      }
    });

    // Remove old tracked faces
    for (const [id, trackedFace] of newTrackedFaces.entries()) {
      if (trackedFace.frameCount > maxFrames) {
        newTrackedFaces.delete(id);
      }
    }

    setTrackedFaces(newTrackedFaces);
    return trackedResults;
  }, [basicDetection.detectFaces, options, trackedFaces]);

  return {
    ...basicDetection,
    detectAndTrack,
    trackedFacesCount: trackedFaces.size,
    clearTracking: () => setTrackedFaces(new Map())
  };
}