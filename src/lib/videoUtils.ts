// Video processing utilities for anonymization and stream handling

export interface VideoProcessingOptions {
  anonymizationMode: 'blur' | 'pixelate' | 'black-box';
  blurIntensity: number;
  quality: 'low' | 'medium' | 'high';
  targetFPS: number;
}

export interface ProcessingStats {
  frameCount: number;
  droppedFrames: number;
  averageProcessingTime: number;
  currentFPS: number;
}

export class VideoProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private processingStats: ProcessingStats;
  private isProcessing: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas 2D context');
    }
    this.ctx = context;
    this.processingStats = {
      frameCount: 0,
      droppedFrames: 0,
      averageProcessingTime: 0,
      currentFPS: 0
    };
  }

  applyBlurEffect(
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number
  ): void {
    // Apply Gaussian blur effect
    this.ctx.filter = `blur(${Math.max(2, intensity / 2)}px)`;
    this.ctx.drawImage(this.canvas, x, y, width, height, x, y, width, height);
    this.ctx.filter = 'none';
  }

  applyPixelateEffect(
    x: number,
    y: number,
    width: number,
    height: number,
    pixelSize: number
  ): void {
    const imageData = this.ctx.getImageData(x, y, width, height);
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

    this.ctx.putImageData(imageData, x, y);
  }

  applyBlackBoxEffect(
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // Draw black box
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(x, y, width, height);

    // Add privacy indicator
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.font = `${Math.min(width, height) / 6}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('PRIVATE', x + width / 2, y + height / 2);
  }

  processFrame(
    videoElement: HTMLVideoElement,
    faces: Array<{ x: number; y: number; width: number; height: number; confidence: number }>,
    options: VideoProcessingOptions
  ): void {
    const startTime = performance.now();

    // Set canvas dimensions to match video
    this.canvas.width = videoElement.videoWidth;
    this.canvas.height = videoElement.videoHeight;

    // Draw video frame to canvas
    this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);

    // Apply anonymization to detected faces
    faces.forEach(face => {
      const faceX = face.x * this.canvas.width;
      const faceY = face.y * this.canvas.height;
      const faceWidth = face.width * this.canvas.width;
      const faceHeight = face.height * this.canvas.height;

      switch (options.anonymizationMode) {
        case 'blur':
          this.applyBlurEffect(faceX, faceY, faceWidth, faceHeight, options.blurIntensity);
          break;
        case 'pixelate':
          this.applyPixelateEffect(faceX, faceY, faceWidth, faceHeight, Math.max(8, options.blurIntensity));
          break;
        case 'black-box':
          this.applyBlackBoxEffect(faceX, faceY, faceWidth, faceHeight);
          break;
      }
    });

    // Update processing statistics
    const processingTime = performance.now() - startTime;
    this.updateStats(processingTime);
  }

  private updateStats(processingTime: number): void {
    this.processingStats.frameCount++;
    this.processingStats.averageProcessingTime = 
      (this.processingStats.averageProcessingTime * (this.processingStats.frameCount - 1) + processingTime) / 
      this.processingStats.frameCount;
  }

  getStats(): ProcessingStats {
    return { ...this.processingStats };
  }

  resetStats(): void {
    this.processingStats = {
      frameCount: 0,
      droppedFrames: 0,
      averageProcessingTime: 0,
      currentFPS: 0
    };
  }

  setProcessing(processing: boolean): void {
    this.isProcessing = processing;
  }

  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }
}

// Utility functions for video stream handling
export class VideoStreamHandler {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  async startRecording(stream: MediaStream, options?: MediaRecorderOptions): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      throw new Error('Recording already in progress');
    }

    const defaultOptions: MediaRecorderOptions = {
      mimeType: 'video/webm;codecs=vp8',
      videoBitsPerSecond: 2500000 // 2.5 Mbps
    };

    const config = { ...defaultOptions, ...options };

    try {
      this.mediaRecorder = new MediaRecorder(stream, config);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording to stop'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        resolve(blob);
      };

      this.mediaRecorder.onerror = (event) => {
        reject(new Error(`Recording error: ${event}`));
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  downloadVideo(blob: Blob, filename: string = 'anonymized-video.webm'): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

// Frame rate optimization utilities
export class FrameRateOptimizer {
  private targetFPS: number;
  private lastFrameTime: number = 0;
  private frameInterval: number;

  constructor(targetFPS: number = 30) {
    this.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
  }

  shouldProcessFrame(currentTime: number): boolean {
    if (currentTime - this.lastFrameTime >= this.frameInterval) {
      this.lastFrameTime = currentTime;
      return true;
    }
    return false;
  }

  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
    this.frameInterval = 1000 / fps;
  }

  getTargetFPS(): number {
    return this.targetFPS;
  }
}

// Performance monitoring
export function getVideoPerformanceInfo(): {
  memoryUsage?: number;
  frameDrops?: number;
  cpuUsage?: number;
} {
  const info: any = {};

  // Get memory usage if available
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    info.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize * 100;
  }

  // Get frame drops from video element if available
  if ('getVideoPlaybackQuality' in HTMLVideoElement.prototype) {
    // This would need to be called on a specific video element
    // info.frameDrops = videoElement.getVideoPlaybackQuality().droppedVideoFrames;
  }

  return info;
}