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
};

export interface IndicatorFilters {
  startDate: string;
  endDate: string;
  vertical: DimensionFilter;
  horizontal: DimensionFilter;
  transversal: DimensionFilter;
};