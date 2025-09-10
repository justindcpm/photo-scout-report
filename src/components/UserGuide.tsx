import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, MapPin, Search, Camera, Ruler, Eye, FileText, CheckCircle } from 'lucide-react';

interface UserGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserGuide = ({ open, onOpenChange }: UserGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'overview',
      title: 'Welcome to Damage Assessment Tool',
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-muted-foreground">
            This tool helps you easily review and analyze damage assessment reports with photos and maps.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">What can you do?</h4>
            <ul className="text-blue-800 space-y-1">
              <li>• View damage photos in an organized gallery</li>
              <li>• See photo locations on an interactive map</li>
              <li>• Measure distances and analyze damage</li>
              <li>• Generate professional reports</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'upload',
      title: 'Step 1: Upload Your Photos',
      icon: <Upload className="w-8 h-8 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p>Start by uploading your damage assessment photos:</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click the <strong>"Choose Files"</strong> button</li>
              <li>Select all your damage photos at once</li>
              <li>The tool will automatically organize them by damage location</li>
            </ol>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-amber-800 text-sm">
              <strong>Tip:</strong> Photos with GPS location data will show up on the map automatically!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'gallery',
      title: 'Step 2: Browse Photos',
      icon: <Camera className="w-8 h-8 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <p>Use the photo gallery to examine damage in detail:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold mb-2">Gallery Features:</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Large view:</strong> See photos clearly</li>
                <li>• <strong>Navigate:</strong> Use arrow buttons or thumbnails</li>
                <li>• <strong>Zoom:</strong> Click zoom button for closer look</li>
                <li>• <strong>Rotate:</strong> Fix photo orientation</li>
              </ul>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Photo Types:</h4>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span>Damage photos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span>Before (precondition)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span>After (completion)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'map',
      title: 'Step 3: Interactive Map',
      icon: <MapPin className="w-8 h-8 text-red-600" />,
      content: (
        <div className="space-y-4">
          <p>The map shows where each photo was taken:</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Map Features:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium mb-2">Navigation:</h5>
                <ul className="space-y-1">
                  <li>• Zoom in/out with mouse wheel</li>
                  <li>• Drag to move around</li>
                  <li>• Click markers to see photos</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">Map Tools:</h5>
                <ul className="space-y-1">
                  <li>• <strong>🛰️ Satellite:</strong> Switch to aerial view</li>
                  <li>• <strong>📏 Measure:</strong> Measure distances</li>
                  <li>• <strong>🎯 Fit View:</strong> See all locations</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              <strong>Smart Sync:</strong> When you select a photo in the gallery, it automatically highlights on the map!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'measure',
      title: 'Step 4: Measure & Analyze',
      icon: <Ruler className="w-8 h-8 text-orange-600" />,
      content: (
        <div className="space-y-4">
          <p>Use the measurement tools to assess damage scope:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold mb-2">Auto Measurements:</h4>
              <ul className="text-sm space-y-1">
                <li>• Automatic distance between first and last photo</li>
                <li>• Shows damage area coverage</li>
                <li>• Helpful for quick assessments</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold mb-2">Manual Measurements:</h4>
              <ul className="text-sm space-y-1">
                <li>• Click "📏 Measure" to start</li>
                <li>• Click two points on the map</li>
                <li>• Get precise distance measurements</li>
              </ul>
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <p className="text-purple-800 text-sm">
              <strong>Pro Tip:</strong> Use satellite view with measurements for the most accurate damage assessment!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'reports',
      title: 'Step 5: Generate Reports',
      icon: <FileText className="w-8 h-8 text-green-600" />,
      content: (
        <div className="space-y-4">
          <p>Create professional reports from your assessment:</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Report Features:</h4>
            <ul className="text-sm space-y-2">
              <li>• <strong>Photo Gallery:</strong> All damage photos organized</li>
              <li>• <strong>Location Maps:</strong> GPS coordinates and satellite views</li>
              <li>• <strong>Measurements:</strong> Distance calculations included</li>
              <li>• <strong>Professional Format:</strong> Ready for clients or insurance</li>
            </ul>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-green-800 text-sm">
              Click <strong>"Generate Report"</strong> when you're ready to create your professional assessment document.
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{currentStepData.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-2">
                  {currentStepData.icon}
                  <span className="text-sm text-muted-foreground">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2 ml-4">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="pt-6">
            {currentStepData.content}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-primary' 
                    : index < currentStep 
                      ? 'bg-primary/50' 
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleBack}>
                Get Started!
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};