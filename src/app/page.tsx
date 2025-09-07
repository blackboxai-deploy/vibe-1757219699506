"use client";

import { useState, useRef } from 'react';
import { VideoProcessor } from '@/components/VideoProcessor';
import { ControlPanel } from '@/components/ControlPanel';
import { SettingsModal } from '@/components/SettingsModal';
import { StreamViewer } from '@/components/StreamViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProcessingStats {
  facesDetected: number;
  processingTime: number;
  frameRate: number;
  isProcessing: boolean;
}

export default function HomePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [videoSource, setVideoSource] = useState<'webcam' | 'file' | 'demo'>('webcam');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStats, setProcessingStats] = useState<ProcessingStats>({
    facesDetected: 0,
    processingTime: 0,
    frameRate: 0,
    isProcessing: false
  });
  const [privacySettings, setPrivacySettings] = useState({
    blurIntensity: 20,
    detectionSensitivity: 0.7,
    anonymizationMode: 'blur' as 'blur' | 'pixelate' | 'black-box'
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStartProcessing = () => {
    setIsProcessing(true);
    setProcessingStats(prev => ({ ...prev, isProcessing: true }));
  };

  const handleStopProcessing = () => {
    setIsProcessing(false);
    setProcessingStats(prev => ({ ...prev, isProcessing: false }));
  };

  const handleStatsUpdate = (stats: Partial<ProcessingStats>) => {
    setProcessingStats(prev => ({ ...prev, ...stats }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setVideoSource('file');
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${processingStats.isProcessing ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className="text-lg font-semibold">
                  {processingStats.isProcessing ? 'Processing Active' : 'System Ready'}
                </span>
              </div>
              {processingStats.isProcessing && (
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <Badge variant="outline" className="border-green-500 text-green-400">
                    {processingStats.facesDetected} Faces Detected
                  </Badge>
                  <Badge variant="outline" className="border-blue-500 text-blue-400">
                    {processingStats.frameRate.toFixed(1)} FPS
                  </Badge>
                  <Badge variant="outline" className="border-purple-500 text-purple-400">
                    {processingStats.processingTime.toFixed(1)}ms
                  </Badge>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(true)}
              className="border-gray-600 hover:border-gray-500"
            >
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Processing Area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Stream */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Real-Time Video Processing
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant={videoSource === 'webcam' ? 'default' : 'outline'}
                    onClick={() => setVideoSource('webcam')}
                  >
                    Webcam
                  </Button>
                  <Button
                    size="sm"
                    variant={videoSource === 'demo' ? 'default' : 'outline'}
                    onClick={() => setVideoSource('demo')}
                  >
                    Demo Feed
                  </Button>
                  <div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="video-upload"
                    />
                    <Button
                      size="sm"
                      variant={videoSource === 'file' ? 'default' : 'outline'}
                      onClick={() => document.getElementById('video-upload')?.click()}
                    >
                      Upload Video
                    </Button>
                  </div>
                </div>
              </CardTitle>
              <CardDescription>
                Live face detection and anonymization. All processing happens locally on your device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <StreamViewer
                  videoSource={videoSource}
                  selectedFile={selectedFile}
                  isProcessing={isProcessing}
                  privacySettings={privacySettings}
                  onStatsUpdate={handleStatsUpdate}
                  ref={videoRef}
                />
                
                {/* Processing Overlay */}
                {processingStats.isProcessing && (
                  <div className="absolute top-4 right-4 bg-black/70 rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400">Live Processing</span>
                    </div>
                  </div>
                )}
                
                {/* Privacy Protection Notice */}
                <div className="absolute bottom-4 left-4 bg-black/70 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-400">Privacy Protected</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex space-x-3">
            <Button
              onClick={isProcessing ? handleStopProcessing : handleStartProcessing}
              className={`flex-1 ${isProcessing 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isProcessing ? 'Stop Processing' : 'Start Anonymization'}
            </Button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          <ControlPanel
            privacySettings={privacySettings}
            onSettingsChange={setPrivacySettings}
            processingStats={processingStats}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      {/* Privacy Information */}
      <Card className="bg-gray-800/30 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg">Privacy & Security</CardTitle>
          <CardDescription>
            Your privacy is our top priority. Here's how we protect your data:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mt-1">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-green-400 mb-1">Local Processing</h4>
                <p className="text-sm text-gray-300">All video analysis happens on your device. No data is uploaded to servers.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mt-1">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">Real-time Protection</h4>
                <p className="text-sm text-gray-300">Faces are anonymized instantly without storing original footage.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mt-1">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-purple-400 mb-1">Compliance Ready</h4>
                <p className="text-sm text-gray-300">Built to meet GDPR, CCPA, and other privacy regulations.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        privacySettings={privacySettings}
        onSettingsChange={setPrivacySettings}
      />

      {/* Hidden Video Processing Component */}
      <VideoProcessor
        isActive={isProcessing}
        privacySettings={privacySettings}
        onStatsUpdate={handleStatsUpdate}
      />
    </div>
  );
}