"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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

interface ControlPanelProps {
  privacySettings: PrivacySettings;
  onSettingsChange: (settings: PrivacySettings) => void;
  processingStats: ProcessingStats;
  isProcessing: boolean;
}

export function ControlPanel({ 
  privacySettings, 
  onSettingsChange, 
  processingStats, 
  isProcessing 
}: ControlPanelProps) {
  const [isRecording, setIsRecording] = useState(false);

  const handleBlurIntensityChange = (value: number[]) => {
    onSettingsChange({
      ...privacySettings,
      blurIntensity: value[0]
    });
  };

  const handleSensitivityChange = (value: number[]) => {
    onSettingsChange({
      ...privacySettings,
      detectionSensitivity: value[0] / 100
    });
  };

  const handleModeChange = (mode: string) => {
    onSettingsChange({
      ...privacySettings,
      anonymizationMode: mode as 'blur' | 'pixelate' | 'black-box'
    });
  };

  const handleStartRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual recording functionality
  };

  const getPerformanceColor = (fps: number) => {
    if (fps >= 25) return 'text-green-400';
    if (fps >= 15) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getDetectionColor = (count: number) => {
    if (count === 0) return 'text-gray-400';
    if (count <= 5) return 'text-green-400';
    if (count <= 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Processing Statistics */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Live Statistics</CardTitle>
          <CardDescription>Real-time processing metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-700/30 rounded-lg">
              <div className={`text-2xl font-bold ${getDetectionColor(processingStats.facesDetected)}`}>
                {processingStats.facesDetected}
              </div>
              <div className="text-xs text-gray-400 mt-1">Faces Detected</div>
            </div>
            <div className="text-center p-3 bg-gray-700/30 rounded-lg">
              <div className={`text-2xl font-bold ${getPerformanceColor(processingStats.frameRate)}`}>
                {processingStats.frameRate.toFixed(1)}
              </div>
              <div className="text-xs text-gray-400 mt-1">FPS</div>
            </div>
          </div>
          
          <div className="text-center p-3 bg-gray-700/30 rounded-lg">
            <div className="text-xl font-bold text-blue-400">
              {processingStats.processingTime.toFixed(1)}ms
            </div>
            <div className="text-xs text-gray-400 mt-1">Processing Time</div>
          </div>

          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-300">
              {isProcessing ? 'Processing Active' : 'Idle'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Controls */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Privacy Controls</CardTitle>
          <CardDescription>Adjust anonymization settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Anonymization Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Anonymization Mode</Label>
            <Select value={privacySettings.anonymizationMode} onValueChange={handleModeChange}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="blur">Blur Faces</SelectItem>
                <SelectItem value="pixelate">Pixelate</SelectItem>
                <SelectItem value="black-box">Black Box</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                Current: {privacySettings.anonymizationMode}
              </Badge>
            </div>
          </div>

          {/* Blur Intensity */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">
                {privacySettings.anonymizationMode === 'blur' ? 'Blur' : 
                 privacySettings.anonymizationMode === 'pixelate' ? 'Pixel Size' : 'Effect'} Intensity
              </Label>
              <Badge variant="secondary" className="text-xs">
                {privacySettings.blurIntensity}
              </Badge>
            </div>
            <Slider
              value={[privacySettings.blurIntensity]}
              onValueChange={handleBlurIntensityChange}
              max={50}
              min={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Light</span>
              <span>Heavy</span>
            </div>
          </div>

          {/* Detection Sensitivity */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Detection Sensitivity</Label>
              <Badge variant="secondary" className="text-xs">
                {Math.round(privacySettings.detectionSensitivity * 100)}%
              </Badge>
            </div>
            <Slider
              value={[privacySettings.detectionSensitivity * 100]}
              onValueChange={handleSensitivityChange}
              max={95}
              min={30}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Conservative</span>
              <span>Aggressive</span>
            </div>
            <div className="text-xs text-gray-500 bg-gray-800/50 p-2 rounded">
              Higher sensitivity detects more faces but may increase false positives
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recording Controls */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recording</CardTitle>
          <CardDescription>Save anonymized video output</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleStartRecording}
            className={`w-full ${isRecording 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={!isProcessing}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          
          {isRecording && (
            <div className="flex items-center justify-center space-x-2 text-sm text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Recording in progress...</span>
            </div>
          )}
          
          <div className="text-xs text-gray-500 bg-gray-800/50 p-2 rounded">
            <div className="space-y-1">
              <div>• Recordings include only anonymized video</div>
              <div>• Original video is never saved</div>
              <div>• Files are stored locally on your device</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Status */}
      <Card className="bg-green-900/20 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div>
              <div className="font-semibold text-green-400">Privacy Protected</div>
              <div className="text-xs text-green-300 mt-1">
                All processing happens locally. No data leaves your device.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}