import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Camera, 
  MapPin, 
  FileText, 
  Calculator, 
  Clock, 
  Shield, 
  Smartphone, 
  Cloud, 
  Users, 
  BarChart3,
  Workflow,
  Settings,
  Database,
  Mail,
  Calendar,
  Zap
} from 'lucide-react';

interface FeatureRecommendation {
  category: string;
  icon: React.ElementType;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  effort: 'Low' | 'Medium' | 'High';
  benefits: string[];
}

interface FeatureRecommendationsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const recommendations: FeatureRecommendation[] = [
  {
    category: "AI & Automation",
    icon: Zap,
    title: "AI-Powered Damage Detection",
    description: "Automatically identify and classify damage types from uploaded photos using computer vision",
    priority: "High",
    effort: "High",
    benefits: ["Faster assessments", "Consistent damage classification", "Reduced human error"]
  },
  {
    category: "AI & Automation", 
    icon: Calculator,
    title: "Smart Cost Estimation",
    description: "AI-driven cost estimates based on damage type, location, and historical repair data",
    priority: "High",
    effort: "Medium",
    benefits: ["Accurate budgeting", "Time savings", "Standardized pricing"]
  },
  {
    category: "Mobile & Field Work",
    icon: Smartphone,
    title: "Progressive Web App (PWA)",
    description: "Convert to PWA for offline functionality and mobile app-like experience",
    priority: "High",
    effort: "Medium",
    benefits: ["Works offline", "Mobile optimization", "Easy installation"]
  },
  {
    category: "Mobile & Field Work",
    icon: Camera,
    title: "Advanced Photo Tools",
    description: "Photo comparison sliders, before/after overlays, and measurement tools within images",
    priority: "Medium",
    effort: "Medium",
    benefits: ["Better visual analysis", "Professional presentations", "Detailed documentation"]
  },
  {
    category: "Collaboration",
    icon: Users,
    title: "Multi-User Collaboration",
    description: "Real-time collaboration with role-based access (assessor, reviewer, client)",
    priority: "High",
    effort: "High",
    benefits: ["Team efficiency", "Real-time updates", "Workflow management"]
  },
  {
    category: "Collaboration",
    icon: Mail,
    title: "Automated Notifications",
    description: "Email/SMS notifications for status updates, approvals, and deadline reminders",
    priority: "Medium",
    effort: "Low",
    benefits: ["Better communication", "Timely updates", "Client satisfaction"]
  },
  {
    category: "Analytics & Reporting",
    icon: BarChart3,
    title: "Advanced Analytics Dashboard",
    description: "Comprehensive analytics with trends, performance metrics, and predictive insights",
    priority: "Medium",
    effort: "Medium",
    benefits: ["Data-driven decisions", "Performance tracking", "Business insights"]
  },
  {
    category: "Analytics & Reporting",
    icon: FileText,
    title: "Custom Report Templates",
    description: "Customizable report templates for different clients, insurance companies, or property types",
    priority: "Medium",
    effort: "Low",
    benefits: ["Brand consistency", "Client requirements", "Time efficiency"]
  },
  {
    category: "Integration",
    icon: Cloud,
    title: "Cloud Storage Integration",
    description: "Integration with Google Drive, Dropbox, and OneDrive for seamless file management",
    priority: "Medium",
    effort: "Low",
    benefits: ["Easy file sharing", "Backup security", "Client access"]
  },
  {
    category: "Integration",
    icon: Database,
    title: "CRM & ERP Integration",
    description: "Connect with popular CRM systems and enterprise resource planning tools",
    priority: "Low",
    effort: "High",
    benefits: ["Workflow automation", "Data synchronization", "Business integration"]
  },
  {
    category: "Workflow & Process",
    icon: Workflow,
    title: "Custom Workflow Builder",
    description: "Build custom approval workflows with conditional logic and automated routing",
    priority: "Medium",
    effort: "High",
    benefits: ["Process automation", "Compliance", "Efficiency gains"]
  },
  {
    category: "Workflow & Process",
    icon: Calendar,
    title: "Scheduling & Task Management",
    description: "Built-in calendar for scheduling assessments, follow-ups, and deadline tracking",
    priority: "Medium",
    effort: "Medium",
    benefits: ["Better organization", "Time management", "Client scheduling"]
  },
  {
    category: "Security & Compliance",
    icon: Shield,
    title: "Advanced Security Features",
    description: "Two-factor authentication, audit trails, and compliance reporting (ISO, SOC)",
    priority: "High",
    effort: "Medium",
    benefits: ["Data security", "Compliance", "Client trust"]
  },
  {
    category: "User Experience",
    icon: Settings,
    title: "Advanced Customization",
    description: "White-label options, custom branding, and configurable assessment fields",
    priority: "Low",
    effort: "Medium",
    benefits: ["Brand recognition", "Client satisfaction", "Flexibility"]
  }
];

const priorityColors = {
  'High': 'destructive',
  'Medium': 'default', 
  'Low': 'secondary'
} as const;

const effortColors = {
  'High': 'destructive',
  'Medium': 'default',
  'Low': 'secondary'
} as const;

export const FeatureRecommendations = ({ open, onOpenChange }: FeatureRecommendationsProps) => {
  const categories = [...new Set(recommendations.map(r => r.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🚀 Feature Recommendations</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Take your Damage Assessment Tool to the next level with these recommended features, 
              prioritized by impact and implementation effort.
            </p>
          </div>

      {categories.map(category => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b pb-2">
            {category}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations
              .filter(rec => rec.category === category)
              .map((rec, index) => {
                const IconComponent = rec.icon;
                return (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <IconComponent className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{rec.title}</h4>
                            <div className="flex gap-2 mt-1">
                              <Badge variant={priorityColors[rec.priority]} className="text-xs">
                                {rec.priority} Priority
                              </Badge>
                              <Badge variant={effortColors[rec.effort]} className="text-xs">
                                {rec.effort} Effort
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {rec.description}
                      </p>
                      
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-foreground">Key Benefits:</h5>
                        <ul className="space-y-1">
                          {rec.benefits.map((benefit, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-center">
                              <div className="w-1 h-1 bg-primary rounded-full mr-2" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}

      <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-primary">🎯 Implementation Roadmap</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-destructive">Phase 1: Quick Wins</h4>
              <p className="text-muted-foreground">
                Start with High Priority + Low Effort features like automated notifications 
                and custom report templates.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-orange-600">Phase 2: Core Features</h4>
              <p className="text-muted-foreground">
                Implement PWA functionality, AI cost estimation, and advanced security features.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">Phase 3: Advanced</h4>
              <p className="text-muted-foreground">
                Add AI damage detection, multi-user collaboration, and enterprise integrations.
              </p>
            </div>
          </div>
          <Button className="mt-4">
            Download Implementation Guide
          </Button>
        </div>
      </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};