export interface PropertyDetails {
  address: string;
  propertyType: 'residential' | 'commercial' | 'industrial' | 'other';
  buildingAge?: number;
  constructionType?: string;
  floorArea?: number;
  storeys?: number;
  occupancy?: 'owner' | 'tenant' | 'vacant';
}

export interface AssessmentConditions {
  weatherConditions: 'clear' | 'cloudy' | 'rainy' | 'windy' | 'storm' | 'other';
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  visibility: 'excellent' | 'good' | 'fair' | 'poor';
  accessibilityIssues?: string;
}

export interface AssessorInfo {
  name: string;
  licenseNumber?: string;
  company: string;
  contactNumber: string;
  email: string;
  qualifications?: string[];
}

export interface RepairEstimate {
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'structural' | 'cosmetic' | 'electrical' | 'plumbing' | 'roofing' | 'other';
  description: string;
  materialsCost?: number;
  laborCost?: number;
  equipmentCost?: number;
  totalEstimate?: number;
  timelineWeeks?: number;
  recommendedContractors?: string[];
  insuranceClaim?: boolean;
}

export interface AssessmentMetrics {
  distanceMeters?: number;
  areaSquareMeters?: number;
  perimeter?: number;
  costAUD?: number;
  urgencyScore: 1 | 2 | 3 | 4 | 5; // 1 = low, 5 = critical
}

export interface CompleteAssessment {
  id: string;
  assessmentDate: Date;
  propertyDetails: PropertyDetails;
  conditions: AssessmentConditions;
  assessor: AssessorInfo;
  damageDescription: string;
  causeOfDamage?: string;
  repairEstimates: RepairEstimate[];
  metrics: AssessmentMetrics;
  followUpRequired: boolean;
  followUpDate?: Date;
  insuranceClaimNumber?: string;
  riskAssessment?: string;
  recommendations: string[];
  completionCertificate?: boolean;
}