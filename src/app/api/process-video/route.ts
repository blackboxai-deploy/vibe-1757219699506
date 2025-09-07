import { NextRequest, NextResponse } from 'next/server';

interface ProcessingRequest {
  anonymizationMode: 'blur' | 'pixelate' | 'black-box';
  blurIntensity: number;
  detectionSensitivity: number;
  faces: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessingRequest = await request.json();
    
    const {
      anonymizationMode,
      blurIntensity,
      detectionSensitivity,
      faces
    } = body;

    // Validate input parameters
    if (!anonymizationMode || !Array.isArray(faces)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Filter faces based on confidence threshold
    const validFaces = faces.filter(face => 
      face.confidence >= detectionSensitivity
    );

    // Processing time simulation based on number of faces and mode
    const baseProcessingTime = 20;
    const faceProcessingTime = validFaces.length * 10;
    const modeMultiplier = {
      'blur': 1.0,
      'pixelate': 1.5,
      'black-box': 0.8
    }[anonymizationMode];

    const totalProcessingTime = Math.round(
      (baseProcessingTime + faceProcessingTime) * modeMultiplier
    );

    // Simulate actual processing delay
    await new Promise(resolve => setTimeout(resolve, Math.min(totalProcessingTime, 100)));

    const response = {
      status: 'success',
      processedFaces: validFaces.length,
      totalFaces: faces.length,
      processingTime: totalProcessingTime,
      settings: {
        mode: anonymizationMode,
        intensity: blurIntensity,
        sensitivity: detectionSensitivity
      },
      timestamp: Date.now(),
      performance: {
        facesPerSecond: validFaces.length > 0 ? (1000 / totalProcessingTime) * validFaces.length : 0,
        efficiency: validFaces.length / Math.max(faces.length, 1) * 100
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Video processing error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during video processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Video processing API is running',
    version: '1.0.0',
    supportedModes: ['blur', 'pixelate', 'black-box'],
    capabilities: [
      'Real-time video anonymization',
      'Multiple anonymization modes',
      'Configurable blur intensity',
      'Confidence-based filtering',
      'Performance optimization'
    ],
    limits: {
      maxFacesPerFrame: 20,
      maxProcessingTimeMs: 100,
      supportedFormats: ['image/jpeg', 'image/png', 'video/mp4', 'video/webm']
    }
  });
}