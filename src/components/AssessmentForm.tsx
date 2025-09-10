import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Plus, Trash2, Save, ChevronDown, Building, Cloud, User, Wrench } from 'lucide-react';
import { CompleteAssessment, PropertyDetails, AssessmentConditions, AssessorInfo, RepairEstimate, AssessmentMetrics } from '@/types/assessment-fields';

interface AssessmentFormProps {
  damageId: string;
  onAssessmentChange: (assessment: Partial<CompleteAssessment>) => void;
  initialAssessment?: Partial<CompleteAssessment>;
}

export const AssessmentForm = ({ damageId, onAssessmentChange, initialAssessment }: AssessmentFormProps) => {
  const [assessment, setAssessment] = useState<Partial<CompleteAssessment>>({
    id: damageId,
    assessmentDate: new Date(),
    propertyDetails: {
      address: '',
      propertyType: 'residential',
    },
    conditions: {
      weatherConditions: 'clear',
      visibility: 'excellent',
    },
    assessor: {
      name: '',
      company: '',
      contactNumber: '',
      email: '',
    },
    damageDescription: '',
    repairEstimates: [],
    metrics: {
      urgencyScore: 3,
    },
    followUpRequired: false,
    recommendations: [],
    ...initialAssessment,
  });

  const [openSections, setOpenSections] = useState({
    property: true,
    conditions: false,
    assessor: false,
    repairs: false,
  });

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem(`assessment_${damageId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAssessment({ ...assessment, ...parsed });
      } catch (e) {
        console.warn('Failed to parse saved assessment data');
      }
    }
  }, [damageId]);

  useEffect(() => {
    // Save to localStorage and notify parent
    localStorage.setItem(`assessment_${damageId}`, JSON.stringify(assessment));
    onAssessmentChange(assessment);
  }, [assessment, damageId, onAssessmentChange]);

  const updateAssessment = <K extends keyof CompleteAssessment>(
    key: K,
    value: CompleteAssessment[K] | ((prev: CompleteAssessment[K]) => CompleteAssessment[K])
  ) => {
    setAssessment(prev => ({
      ...prev,
      [key]: typeof value === 'function' ? value(prev[key] as CompleteAssessment[K]) : value,
    }));
  };

  const updatePropertyDetails = <K extends keyof PropertyDetails>(key: K, value: PropertyDetails[K]) => {
    updateAssessment('propertyDetails', prev => ({ ...prev, [key]: value }));
  };

  const updateConditions = <K extends keyof AssessmentConditions>(key: K, value: AssessmentConditions[K]) => {
    updateAssessment('conditions', prev => ({ ...prev, [key]: value }));
  };

  const updateAssessor = <K extends keyof AssessorInfo>(key: K, value: AssessorInfo[K]) => {
    updateAssessment('assessor', prev => ({ ...prev, [key]: value }));
  };

  const updateMetrics = <K extends keyof AssessmentMetrics>(key: K, value: AssessmentMetrics[K]) => {
    updateAssessment('metrics', prev => ({ ...prev, [key]: value }));
  };

  const addRepairEstimate = () => {
    const newEstimate: RepairEstimate = {
      priority: 'medium',
      category: 'other',
      description: '',
      materialsCost: 0,
      laborCost: 0,
      totalEstimate: 0,
      timelineWeeks: 1,
      insuranceClaim: false,
    };
    updateAssessment('repairEstimates', prev => [...(prev || []), newEstimate]);
  };

  const updateRepairEstimate = (index: number, field: keyof RepairEstimate, value: any) => {
    updateAssessment('repairEstimates', prev => {
      const updated = [...(prev || [])];
      updated[index] = { ...updated[index], [field]: value };
      // Auto-calculate total
      if (['materialsCost', 'laborCost', 'equipmentCost'].includes(field)) {
        const materials = updated[index].materialsCost || 0;
        const labor = updated[index].laborCost || 0;
        const equipment = updated[index].equipmentCost || 0;
        updated[index].totalEstimate = materials + labor + equipment;
      }
      return updated;
    });
  };

  const removeRepairEstimate = (index: number) => {
    updateAssessment('repairEstimates', prev => (prev || []).filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority: RepairEstimate['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building className="w-5 h-5" />
            Professional Assessment Form
            <Badge variant="outline" className="ml-auto">
              {damageId}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Property Details */}
      <Collapsible open={openSections.property} onOpenChange={() => toggleSection('property')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Property Details
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${openSections.property ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Property Address *</Label>
                  <Textarea
                    value={assessment.propertyDetails?.address || ''}
                    onChange={(e) => updatePropertyDetails('address', e.target.value)}
                    placeholder="Enter full property address"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Property Type *</Label>
                  <Select
                    value={assessment.propertyDetails?.propertyType || 'residential'}
                    onValueChange={(value: PropertyDetails['propertyType']) => updatePropertyDetails('propertyType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Building Age (years)</Label>
                  <Input
                    type="number"
                    value={assessment.propertyDetails?.buildingAge || ''}
                    onChange={(e) => updatePropertyDetails('buildingAge', parseInt(e.target.value) || undefined)}
                    placeholder="e.g. 25"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Floor Area (m²)</Label>
                  <Input
                    type="number"
                    value={assessment.propertyDetails?.floorArea || ''}
                    onChange={(e) => updatePropertyDetails('floorArea', parseInt(e.target.value) || undefined)}
                    placeholder="e.g. 150"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Storeys</Label>
                  <Input
                    type="number"
                    value={assessment.propertyDetails?.storeys || ''}
                    onChange={(e) => updatePropertyDetails('storeys', parseInt(e.target.value) || undefined)}
                    placeholder="e.g. 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Occupancy</Label>
                  <Select
                    value={assessment.propertyDetails?.occupancy || ''}
                    onValueChange={(value: PropertyDetails['occupancy']) => updatePropertyDetails('occupancy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner Occupied</SelectItem>
                      <SelectItem value="tenant">Tenant Occupied</SelectItem>
                      <SelectItem value="vacant">Vacant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Assessment Conditions */}
      <Collapsible open={openSections.conditions} onOpenChange={() => toggleSection('conditions')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  Assessment Conditions
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${openSections.conditions ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Weather *</Label>
                  <Select
                    value={assessment.conditions?.weatherConditions || 'clear'}
                    onValueChange={(value: AssessmentConditions['weatherConditions']) => updateConditions('weatherConditions', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear">Clear</SelectItem>
                      <SelectItem value="cloudy">Cloudy</SelectItem>
                      <SelectItem value="rainy">Rainy</SelectItem>
                      <SelectItem value="windy">Windy</SelectItem>
                      <SelectItem value="storm">Storm</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visibility *</Label>
                  <Select
                    value={assessment.conditions?.visibility || 'excellent'}
                    onValueChange={(value: AssessmentConditions['visibility']) => updateConditions('visibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Temperature (°C)</Label>
                  <Input
                    type="number"
                    value={assessment.conditions?.temperature || ''}
                    onChange={(e) => updateConditions('temperature', parseInt(e.target.value) || undefined)}
                    placeholder="e.g. 22"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wind Speed (km/h)</Label>
                  <Input
                    type="number"
                    value={assessment.conditions?.windSpeed || ''}
                    onChange={(e) => updateConditions('windSpeed', parseInt(e.target.value) || undefined)}
                    placeholder="e.g. 15"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Assessor Information */}
      <Collapsible open={openSections.assessor} onOpenChange={() => toggleSection('assessor')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assessor Information
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${openSections.assessor ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assessor Name *</Label>
                  <Input
                    value={assessment.assessor?.name || ''}
                    onChange={(e) => updateAssessor('name', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <Input
                    value={assessment.assessor?.company || ''}
                    onChange={(e) => updateAssessor('company', e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number *</Label>
                  <Input
                    value={assessment.assessor?.contactNumber || ''}
                    onChange={(e) => updateAssessor('contactNumber', e.target.value)}
                    placeholder="+61 4XX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={assessment.assessor?.email || ''}
                    onChange={(e) => updateAssessor('email', e.target.value)}
                    placeholder="assessor@company.com"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Repair Estimates */}
      <Collapsible open={openSections.repairs} onOpenChange={() => toggleSection('repairs')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Repair Estimates
                  {assessment.repairEstimates?.length ? (
                    <Badge variant="secondary">
                      {assessment.repairEstimates.length}
                    </Badge>
                  ) : null}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${openSections.repairs ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <Button onClick={addRepairEstimate} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Repair Estimate
              </Button>

              {assessment.repairEstimates?.map((estimate, index) => (
                <Card key={index} className="p-4 border-l-4 border-l-orange-500">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={getPriorityColor(estimate.priority)}>
                        {estimate.priority.toUpperCase()} PRIORITY
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRepairEstimate(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select
                          value={estimate.priority}
                          onValueChange={(value: RepairEstimate['priority']) =>
                            updateRepairEstimate(index, 'priority', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={estimate.category}
                          onValueChange={(value: RepairEstimate['category']) =>
                            updateRepairEstimate(index, 'category', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="structural">Structural</SelectItem>
                            <SelectItem value="cosmetic">Cosmetic</SelectItem>
                            <SelectItem value="electrical">Electrical</SelectItem>
                            <SelectItem value="plumbing">Plumbing</SelectItem>
                            <SelectItem value="roofing">Roofing</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Timeline (weeks)</Label>
                        <Input
                          type="number"
                          value={estimate.timelineWeeks || ''}
                          onChange={(e) =>
                            updateRepairEstimate(index, 'timelineWeeks', parseInt(e.target.value) || 0)
                          }
                          placeholder="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={estimate.description}
                        onChange={(e) => updateRepairEstimate(index, 'description', e.target.value)}
                        placeholder="Detailed description of repair work required..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Materials (AUD)</Label>
                        <Input
                          type="number"
                          value={estimate.materialsCost || ''}
                          onChange={(e) =>
                            updateRepairEstimate(index, 'materialsCost', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Labor (AUD)</Label>
                        <Input
                          type="number"
                          value={estimate.laborCost || ''}
                          onChange={(e) =>
                            updateRepairEstimate(index, 'laborCost', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Equipment (AUD)</Label>
                        <Input
                          type="number"
                          value={estimate.equipmentCost || ''}
                          onChange={(e) =>
                            updateRepairEstimate(index, 'equipmentCost', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total (AUD)</Label>
                        <Input
                          type="number"
                          value={estimate.totalEstimate || ''}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`insurance-${index}`}
                        checked={estimate.insuranceClaim || false}
                        onCheckedChange={(checked) =>
                          updateRepairEstimate(index, 'insuranceClaim', !!checked)
                        }
                      />
                      <Label htmlFor={`insurance-${index}`}>Insurance claim eligible</Label>
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Damage Description & Summary */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Damage Description *</Label>
            <Textarea
              value={assessment.damageDescription || ''}
              onChange={(e) => updateAssessment('damageDescription', e.target.value)}
              placeholder="Detailed description of observed damage..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cause of Damage</Label>
              <Input
                value={assessment.causeOfDamage || ''}
                onChange={(e) => updateAssessment('causeOfDamage', e.target.value)}
                placeholder="e.g. Storm damage, impact, wear and tear"
              />
            </div>
            <div className="space-y-2">
              <Label>Urgency Score (1-5)</Label>
              <Select
                value={String(assessment.metrics?.urgencyScore || 3)}
                onValueChange={(value) => updateMetrics('urgencyScore', parseInt(value) as 1 | 2 | 3 | 4 | 5)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Low</SelectItem>
                  <SelectItem value="2">2 - Low</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4 - High</SelectItem>
                  <SelectItem value="5">5 - Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="followup"
              checked={assessment.followUpRequired || false}
              onCheckedChange={(checked) => updateAssessment('followUpRequired', !!checked)}
            />
            <Label htmlFor="followup">Follow-up inspection required</Label>
          </div>

          {assessment.followUpRequired && (
            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={assessment.followUpDate ? assessment.followUpDate.toISOString().split('T')[0] : ''}
                onChange={(e) => updateAssessment('followUpDate', e.target.value ? new Date(e.target.value) : undefined)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};