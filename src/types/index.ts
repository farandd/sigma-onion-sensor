export type SystemType = 'portable' | 'panel';
export type LandId = string

export interface Profile {
  id: string;
  full_name: string;
  system_type: SystemType;
  created_at: string;
  updated_at: string;
}

export interface SensorReading {
  id?: string;
  user_id?: string;
  system_type: SystemType;
  land_id?: LandId;
  moisture: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  ph: number;
  conductivity: number;
  created_at?: string;
}

export interface AIDetection {
  id?: string;
  user_id?: string;
  system_type: SystemType;
  land_id?: LandId;
  image_url: string;
  label: string;
  confidence: number;
  bbox_x: number;
  bbox_y: number;
  bbox_width: number;
  bbox_height: number;
  created_at?: string;
}

export interface AIAnalysisRecord {
  id?: string;
  user_id?: string;
  system_type: SystemType;
  land_id: LandId;
  disease_name: string;
  confidence: number;
  recommendation: string;
  image_url: string;
  bbox_x: number;
  bbox_y: number;
  bbox_width: number;
  bbox_height: number;
  latitude?: number | null;
  longitude?: number | null;
  location_source?: 'gps' | 'exif' | 'manual' | null;
  created_at?: string;
}

export interface SensorConfig {
  key: keyof Omit<SensorReading, 'id' | 'user_id' | 'system_type' | 'land_id' | 'created_at'>;
  label: string;
  unit: string;
  min: number;
  max: number;
  goodMin: number;
  goodMax: number;
  color: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface Land {
  id: LandId;
  user_id: string;
  label: string;
  crop: string;
  area?: string;
  latitude?: number | null;
  longitude?: number | null;
  radius_m?: number;
  system_type: SystemType;
  created_at?: string;
}

export interface LandValidationResult {
  matched: boolean;
  land: Land | null;
  distanceM: number | null;
  withinRadius: boolean;
}

export type ActivePage = 'home' | 'dashboard' | 'ai-analysis' | 'history' | 'settings' | 'guidebook';

// ── AI Pipeline Types ────────────────────────────────────────────────────────

export type ImageQualityStatus = 'ok' | 'blurry' | 'metadata_stale' | 'location_mismatch';

export type SensorCorrelation = 'verified' | 'contradiction' | 'nutrient_issue' | 'insufficient_data';

export interface ActionStep {
  phase: 'physical' | 'chemical' | 'monitoring';
  label: string;
  detail: string;
  urgency: 'immediate' | 'within_24h' | 'routine';
}

export interface PipelineResult {
  imageQuality: ImageQualityStatus;
  imageQualityMessage: string;
  metadataAgeHours: number | null;
  locationDistanceM: number | null;
  sensorCorrelation: SensorCorrelation;
  sensorCorrelationMessage: string;
  overriddenLabel: string | null;
  scientificVerified: boolean;
  severityScore: number;
  severityLabel: 'Ringan' | 'Sedang' | 'Berat';
  actionSteps: ActionStep[];
}

export interface EnrichedDetection extends AIDetection {
  pipeline: PipelineResult;
}

export interface UserPreferences {
  user_id: string;
  active_mode: SystemType;
  selected_land: LandId;
  notif_enabled: boolean;
  auto_sync: boolean;
  updated_at?: string;
}
