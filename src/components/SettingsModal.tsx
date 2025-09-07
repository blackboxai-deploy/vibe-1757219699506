"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

interface PrivacySettings {
  blurIntensity: number;
  detectionSensitivity: number;
  anonymizationMode: 'blur' | 'pixelate' | 'black-box';
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  privacySettings: PrivacySettings;
  onSettingsChange: (settings: PrivacySettings) => void;
}

export function SettingsModal({ isOpen, onClose, privacySettings, onSettingsChange }: SettingsModalProps) {
  const [tempSettings, setTempSettings] = useState<PrivacySettings>(privacySettings);
  const [advancedSettings, setAdvancedSettings] = useState({
    enableFaceTracking: true,
    multiScaleDetection: true,
    temporalSmoothing: false,
    edgeEnhancement: false,
    adaptiveThreshold: true,
    batchProcessing: false,
    gpuAcceleration: false,
    debugMode: false
  });

  const handleSaveSettings = () => {
    onSettingsChange(tempSettings);
    onClose();
  };

  const handleResetSettings = () => {
    const defaultSettings: PrivacySettings = {
      blurIntensity: 20,
      detectionSensitivity: 0.7,
      anonymizationMode: 'blur'
    };
    setTempSettings(defaultSettings);
  };

  const handleAdvancedToggle = (key: string, value: boolean) => {
    setAdvancedSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const performancePresets = [
    { name: 'Performance', sensitivity: 0.5, blur: 15, mode: 'blur' as const },
    { name: 'Balanced', sensitivity: 0.7, blur: 20, mode: 'blur' as const },
    { name: 'Quality', sensitivity: 0.9, blur: 25, mode: 'blur' as const },
    { name: 'Maximum Privacy', sensitivity: 0.9, blur: 35, mode: 'black-box' as const }
  ];

  const applyPreset = (preset: typeof performancePresets[0]) => {
    setTempSettings({
      detectionSensitivity: preset.sensitivity,
      blurIntensity: preset.blur,
      anonymizationMode: preset.mode
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Privacy & Processing Settings</DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure face detection and anonymization parameters for optimal privacy protection.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="privacy" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-700">
            <TabsTrigger value="privacy" className="text-white">Privacy</TabsTrigger>
            <TabsTrigger value="performance" className="text-white">Performance</TabsTrigger>
            <TabsTrigger value="advanced" className="text-white">Advanced</TabsTrigger>
            <TabsTrigger value="about" className="text-white">About</TabsTrigger>
          </TabsList>

          <TabsContent value="privacy" className="space-y-6 mt-6">
            {/* Quick Presets */}
            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">Quick Presets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {performancePresets.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => applyPreset(preset)}
                      className="p-4 h-auto flex-col items-start border-gray-600 hover:border-gray-500"
                    >
                      <div className="font-semibold text-white">{preset.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Sensitivity: {Math.round(preset.sensitivity * 100)}% • 
                        Intensity: {preset.blur} • 
                        Mode: {preset.mode}
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Privacy Controls */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-700/50 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">Anonymization Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-white">Processing Mode</Label>
                    <Select 
                      value={tempSettings.anonymizationMode} 
                      onValueChange={(value) => setTempSettings({
                        ...tempSettings,
                        anonymizationMode: value as 'blur' | 'pixelate' | 'black-box'
                      })}
                    >
                      <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-600 border-gray-500">
                        <SelectItem value="blur">Gaussian Blur</SelectItem>
                        <SelectItem value="pixelate">Pixelation</SelectItem>
                        <SelectItem value="black-box">Privacy Box</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-white">Effect Intensity</Label>
                      <Badge variant="secondary">{tempSettings.blurIntensity}</Badge>
                    </div>
                    <Slider
                      value={[tempSettings.blurIntensity]}
                      onValueChange={(value) => setTempSettings({
                        ...tempSettings,
                        blurIntensity: value[0]
                      })}
                      max={50}
                      min={5}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-700/50 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">Detection Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-white">Detection Sensitivity</Label>
                      <Badge variant="secondary">{Math.round(tempSettings.detectionSensitivity * 100)}%</Badge>
                    </div>
                    <Slider
                      value={[tempSettings.detectionSensitivity * 100]}
                      onValueChange={(value) => setTempSettings({
                        ...tempSettings,
                        detectionSensitivity: value[0] / 100
                      })}
                      max={95}
                      min={30}
                      step={5}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 bg-gray-800/50 p-2 rounded">
                      Higher values detect more faces but may include false positives
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6 mt-6">
            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Performance Optimization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">GPU Acceleration</div>
                      <div className="text-xs text-gray-400">Use WebGL for faster processing</div>
                    </div>
                    <Switch
                      checked={advancedSettings.gpuAcceleration}
                      onCheckedChange={(checked) => handleAdvancedToggle('gpuAcceleration', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Batch Processing</div>
                      <div className="text-xs text-gray-400">Process multiple frames at once</div>
                    </div>
                    <Switch
                      checked={advancedSettings.batchProcessing}
                      onCheckedChange={(checked) => handleAdvancedToggle('batchProcessing', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Multi-scale Detection</div>
                      <div className="text-xs text-gray-400">Detect faces at different sizes</div>
                    </div>
                    <Switch
                      checked={advancedSettings.multiScaleDetection}
                      onCheckedChange={(checked) => handleAdvancedToggle('multiScaleDetection', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Temporal Smoothing</div>
                      <div className="text-xs text-gray-400">Reduce flickering between frames</div>
                    </div>
                    <Switch
                      checked={advancedSettings.temporalSmoothing}
                      onCheckedChange={(checked) => handleAdvancedToggle('temporalSmoothing', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-6">
            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Face Tracking</div>
                      <div className="text-xs text-gray-400">Track faces across frames</div>
                    </div>
                    <Switch
                      checked={advancedSettings.enableFaceTracking}
                      onCheckedChange={(checked) => handleAdvancedToggle('enableFaceTracking', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Adaptive Threshold</div>
                      <div className="text-xs text-gray-400">Automatically adjust detection threshold</div>
                    </div>
                    <Switch
                      checked={advancedSettings.adaptiveThreshold}
                      onCheckedChange={(checked) => handleAdvancedToggle('adaptiveThreshold', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Edge Enhancement</div>
                      <div className="text-xs text-gray-400">Improve detection at image borders</div>
                    </div>
                    <Switch
                      checked={advancedSettings.edgeEnhancement}
                      onCheckedChange={(checked) => handleAdvancedToggle('edgeEnhancement', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Debug Mode</div>
                      <div className="text-xs text-gray-400">Show detection bounding boxes</div>
                    </div>
                    <Switch
                      checked={advancedSettings.debugMode}
                      onCheckedChange={(checked) => handleAdvancedToggle('debugMode', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-6 mt-6">
            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Privacy & Security Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
                    <h4 className="font-semibold text-green-400 mb-2">Local Processing</h4>
                    <p className="text-sm text-gray-300">All video processing happens directly on your device. No video data is ever transmitted to external servers.</p>
                  </div>

                  <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                    <h4 className="font-semibold text-blue-400 mb-2">Data Protection</h4>
                    <p className="text-sm text-gray-300">Original video frames are processed in memory and immediately discarded after anonymization.</p>
                  </div>

                  <div className="p-4 bg-purple-900/20 border border-purple-500/20 rounded-lg">
                    <h4 className="font-semibold text-purple-400 mb-2">Compliance</h4>
                    <p className="text-sm text-gray-300">This system is designed to help meet GDPR, CCPA, and other privacy regulation requirements.</p>
                  </div>

                  <div className="text-xs text-gray-400 space-y-2">
                    <div>• Face detection powered by TensorFlow.js BlazeFace model</div>
                    <div>• Processing time varies based on hardware capabilities</div>
                    <div>• Recommended: Modern browser with hardware acceleration support</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6 border-t border-gray-700">
          <Button variant="outline" onClick={handleResetSettings} className="border-gray-600 text-white hover:bg-gray-700">
            Reset to Defaults
          </Button>
          <div className="space-x-3">
            <Button variant="outline" onClick={onClose} className="border-gray-600 text-white hover:bg-gray-700">
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}