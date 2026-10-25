export type EmailCategory = 'legitimate' | 'conventional_phishing' | 'ai_phishing';

export interface PhishingEmail {
  id: string;
  title: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  category: EmailCategory;
  realismScore: number; // 0 - 100
  detectabilityScore: number;  // 0 - 100
  languagePolish: number; // 0 - 100
  urgencyLevel: 'low' | 'medium' | 'high';
  indicators: string[]; // ['Domain spoofing', 'Linguistic urgency', 'Perfect grammar', etc]
  mitigationRules: string[];
}

export interface AnalysisResult {
  realismScore: number;
  detectabilityScore: number;
  languagePolish: number;
  urgencyLevel: 'low' | 'medium' | 'high';
  detectionDifficulty: 'Very Easy' | 'Easy' | 'Moderate' | 'Difficult' | 'Expert';
  indicators: string[];
  mitigationRules: string[];
  detailedAnalysis: string; // Markdown summary
}

export interface DeepfakeMarker {
  id: string;
  name: string;
  category: 'facial' | 'audio' | 'metadata';
  description: string;
  confidenceScore: number;
  verificationMethod: string;
}

export interface PerturbationSim {
  originalClass: string;
  originalConfidence: number;
  targetClass: string;
  targetConfidence: number;
  noiseLevel: number; // eps value
  perturbedOutput: string;
}

// Ingestion Pipeline Interfaces
export type SourceType = 'api_poller' | 'sensor_feed' | 'user_input';

export interface IngestedPacket {
  id: string;
  timestamp: string; // ISO or formatted
  sourceName: string;
  sourceType: SourceType;
  dataType: string; // e.g., 'Acoustic wave', 'Network packet', 'Auth request', 'NLP log'
  rawSizeKb: number;
  threatLevel: 'safe' | 'suspicious' | 'malicious';
  anomalyConfidence: number; // 0-100%
  rawPayload: string;
  processedPayload: string;
  originalData: any;
  processedData: any;
  appliedRules: string[];
}

export interface PipelineStats {
  throughputKbps: number;
  packetsPerSecond: number;
  latencyMs: number;
  threatCount: number;
  anomalyRatio: number; // percentage
}

export interface IngestionSourceConfig {
  id: SourceType;
  name: string;
  active: boolean;
  rateMs: number;
  endpoint?: string;
}

