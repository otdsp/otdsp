export interface UserAuth {
  id: string;
  email?: string;
  is_active: boolean;
  date_joined: string;
}

export interface UserProfile {
  id: string;
  user_id?: string;
  full_name?: string;
  municipality?: string;
  referral_source?: string;
  institution_organization?: string;
  organization_type?: string;
  job_title?: string;
}

export interface EngagementParticipant {
  user_email: string;
}

export interface Engagement {
  id: string;
  created_by: string;
  status?: string;
  horizontal?: string[];
  vertical?: string[];
  transversal?: string[];
  interests?: string[];
  technologies?: string[];
  public_policies?: string[];
  planned_activities?: string[];
  estimated_duration?: number;
  engagement_participants?: EngagementParticipant[];
  created_at: string;
  event_date?: string | null;
}

export interface MunicipalityParticipant {
  email: string;
  name: string;
  role: string;
  municipality: string;
}

export interface MunicipalityChartRow {
  municipality: string;
  count: number;
  horizontalCount: number;
  verticalCount: number;
  transversalCount: number;
  participants: MunicipalityParticipant[];
}

export interface KPIStats {
  totalUsers: number;
  activeUsers: number;
  totalEngagements: number;
  signedAgreements: number;
}

export interface OrgGroup {
  count: number;
  prettyName: string;
  types: Record<string, number>;
  members: string[];
}

export interface DimensionFilter {
  enabled: boolean;
  values: string[];
}

export interface EvidenceFilters {
  startDate: string;
  endDate: string;
  vertical: DimensionFilter;
  horizontal: DimensionFilter;
  transversal: DimensionFilter;
}

export interface EvidenceFilterOptions {
  verticals: string[];
  horizontals: string[];
  transversals: string[];
}

export interface MetricPoint {
  label: string;
  value: number;
}

export interface TimelinePoint {
  name: string;
  Membros: number;
}

export interface EngagementTimelinePoint {
  name: string;
  Engajamentos: number;
}

export interface PieChartPoint {
  name: string;
  value: number;
  orgType?: string;
  members?: string[];
}

export interface GeoPoint {
  name: string;
  count: number;
  coordinates: [number, number];
}

export interface PillarMetric {
  label: string;
  count: number;
}

export interface PillarGroup {
  category: string;
  items: PillarMetric[];
}

export interface DurationChartSeries {
  dimension: string;
  color: string;
  data: MetricPoint[];
}

export interface DerivedEvidenceData {
  stats: KPIStats;
  timelineData: TimelinePoint[];
  engagementTimelineData: EngagementTimelinePoint[];
  referralData: PieChartPoint[];
  organizationData: PieChartPoint[];
  geoData: GeoPoint[];
  pillarsData: PillarGroup[];
  durationChart: DurationChartSeries[];
  municipalityChartData: MunicipalityChartRow[];
}