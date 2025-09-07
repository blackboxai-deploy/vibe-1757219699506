"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

interface MediaStreamOptions {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

interface UseMediaStreamReturn {
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  startStream: (constraints?: MediaStreamOptions) => Promise<MediaStream | null>;
  stopStream: () => void;
  isSupported: boolean;
}

export function useMediaStream(): UseMediaStreamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if getUserMedia is supported
  const isSupported = typeof navigator !== 'undefined' && 
    'mediaDevices' in navigator && 
    'getUserMedia' in navigator.mediaDevices;

  const startStream = useCallback(async (constraints?: MediaStreamOptions): Promise<MediaStream | null> => {
    if (!isSupported) {
      const errorMsg = 'Media devices not supported in this browser';
      setError(errorMsg);
      return null;
    }

    setIsLoading(true);
    setError(null);

    const defaultConstraints: MediaStreamOptions = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
        facingMode: 'user'
      },
      audio: false
    };

    const finalConstraints = constraints || defaultConstraints;

    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia(finalConstraints);
      
      streamRef.current = newStream;
      setStream(newStream);
      setError(null);
      
      return newStream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      
      let errorMessage = 'Failed to access camera';
      
      if (err instanceof Error) {
        switch (err.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera access denied. Please allow camera permissions.';
            break;
          case 'NotFoundError':
            errorMessage = 'No camera found. Please connect a camera device.';
            break;
          case 'NotReadableError':
            errorMessage = 'Camera is already in use by another application.';
            break;
          case 'OverconstrainedError':
            errorMessage = 'Camera constraints could not be satisfied.';
            break;
          case 'SecurityError':
            errorMessage = 'Camera access blocked due to security restrictions.';
            break;
          default:
            errorMessage = `Camera error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
      setError(null);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle stream ended event
  useEffect(() => {
    if (stream) {
      const handleStreamEnd = () => {
        setStream(null);
        streamRef.current = null;
      };

      stream.getTracks().forEach(track => {
        track.addEventListener('ended', handleStreamEnd);
      });

      return () => {
        stream.getTracks().forEach(track => {
          track.removeEventListener('ended', handleStreamEnd);
        });
      };
    }
    return undefined;
  }, [stream]);

  return {
    stream,
    isLoading,
    error,
    startStream,
    stopStream,
    isSupported
  };
}