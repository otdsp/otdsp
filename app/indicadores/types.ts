export interface UserAuth {
  id: string;
  is_active: boolean;
  date_joined: string;
}

export interface UserProfile {
  id: string;
  user_id?: string;
  municipality?: string;
  referral_source?: string;
  institution_organization?: string;
  organization_type?: string;
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
  created_at: string;
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
}