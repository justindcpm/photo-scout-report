import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Ruler, Calculator, Square, Circle, Trash2 } from 'lucide-react';

interface Measurement {
  id: string;
  type: 'distance' | 'area' | 'perimeter';
  value: number;
  unit: string;
  description: string;
  coordinates?: number[];
}

interface MeasurementToolsProps {
  damageId: string;
  onMeasurementChange?: (measurements: Measurement[]) => void;
}

export const MeasurementTools = ({ damageId, onMeasurementChange }: MeasurementToolsProps) => {
  const [measurements, setMeasurements] = useState<Measurement[]>(() => {
    const saved = localStorage.getItem(`measurements_${damageId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentMeasurement, setCurrentMeasurement] = useState<Partial<Measurement>>({
    type: 'distance',
    unit: 'm',
    description: ''
  });

  const addMeasurement = () => {
    if (!currentMeasurement.value || !currentMeasurement.description) return;

    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      type: currentMeasurement.type || 'distance',
      value: currentMeasurement.value,
      unit: currentMeasurement.unit || 'm',
      description: currentMeasurement.description
    };

    const updatedMeasurements = [...measurements, newMeasurement];
    setMeasurements(updatedMeasurements);
    
    // Save to localStorage
    localStorage.setItem(`measurements_${damageId}`, JSON.stringify(updatedMeasurements));
    
    // Notify parent
    onMeasurementChange?.(updatedMeasurements);
    
    // Reset form
    setCurrentMeasurement({
      type: 'distance',
      unit: 'm',
      description: ''
    });
  };

  const removeMeasurement = (id: string) => {
    const updatedMeasurements = measurements.filter(m => m.id !== id);
    setMeasurements(updatedMeasurements);
    localStorage.setItem(`measurements_${damageId}`, JSON.stringify(updatedMeasurements));
    onMeasurementChange?.(updatedMeasurements);
  };

  const getMeasurementIcon = (type: Measurement['type']) => {
    switch (type) {
      case 'distance': return <Ruler className="w-4 h-4" />;
      case 'area': return <Square className="w-4 h-4" />;
      case 'perimeter': return <Circle className="w-4 h-4" />;
      default: return <Calculator className="w-4 h-4" />;
    }
  };

  const getMeasurementColor = (type: Measurement['type']) => {
    switch (type) {
      case 'distance': return 'bg-blue-500';
      case 'area': return 'bg-green-500';
      case 'perimeter': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatValue = (measurement: Measurement) => {
    const formatted = measurement.type === 'area' 
      ? `${measurement.value} ${measurement.unit}²`
      : `${measurement.value} ${measurement.unit}`;
    return formatted;
  };

  const getTotalCost = () => {
    return measurements.reduce((total, m) => {
      // Simple cost estimation based on measurement type and value
      let costPerUnit = 0;
      switch (m.type) {
        case 'distance': costPerUnit = 50; // $50 per meter for linear repairs
        break;
        case 'area': costPerUnit = 200; // $200 per m² for area repairs
        break;
        case 'perimeter': costPerUnit = 75; // $75 per meter for perimeter work
        break;
      }
      return total + (m.value * costPerUnit);
    }, 0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Measurement Tools
          {measurements.length > 0 && (
            <Badge variant="secondary">{measurements.length} measurements</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Measurement */}
        <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
          <h4 className="font-medium text-sm">Add Measurement</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={currentMeasurement.type}
                onValueChange={(value: Measurement['type']) => 
                  setCurrentMeasurement(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="perimeter">Perimeter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">Value</Label>
              <Input
                type="number"
                step="0.1"
                value={currentMeasurement.value || ''}
                onChange={(e) => 
                  setCurrentMeasurement(prev => ({ 
                    ...prev, 
                    value: parseFloat(e.target.value) || 0 
                  }))
                }
                placeholder="0.0"
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">Unit</Label>
              <Select
                value={currentMeasurement.unit}
                onValueChange={(value) => 
                  setCurrentMeasurement(prev => ({ ...prev, unit: value }))
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm">mm</SelectItem>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                  <SelectItem value="in">in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={addMeasurement}
                size="sm"
                className="h-8 w-full"
                disabled={!currentMeasurement.value || !currentMeasurement.description}
              >
                Add
              </Button>
            </div>
          </div>
          
          <div>
            <Label className="text-xs">Description</Label>
            <Input
              value={currentMeasurement.description}
              onChange={(e) => 
                setCurrentMeasurement(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="e.g. Crack length, damaged area..."
              className="h-8"
            />
          </div>
        </div>

        {/* Measurements List */}
        {measurements.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center justify-between">
              Recorded Measurements
              <Badge variant="outline" className="bg-green-500 text-white">
                Est. Cost: ${getTotalCost().toLocaleString()} AUD
              </Badge>
            </h4>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {measurements.map((measurement) => (
                <div key={measurement.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Badge className={getMeasurementColor(measurement.type)}>
                    <div className="flex items-center gap-1">
                      {getMeasurementIcon(measurement.type)}
                      <span className="capitalize">{measurement.type}</span>
                    </div>
                  </Badge>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {measurement.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatValue(measurement)}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMeasurement(measurement.id)}
                    className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Reference */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <div className="font-medium mb-2">Measurement Guidelines:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>• Distance: Linear measurements (cracks, gaps)</div>
            <div>• Area: Surface damage (water stains, impact areas)</div>
            <div>• Perimeter: Boundary measurements (room edges)</div>
            <div>• Cost estimates are approximate and for reference only</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};