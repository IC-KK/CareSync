import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Patient = {
  id: string;
  mrn: string;
  full_name: string;
  age: number;
  sex: string;
  room: string;
  attending: string | null;
  dx_primary: string;
  drg_code: string | null;
  admission_date: string;
  discharge_date: string | null;
  status: "admitted" | "discharge-ready" | "monitoring" | "discharged";
  los_actual_days: number;
  los_baseline_days: number | null;
  los_predicted_days: number;
  readmission_risk_pct: number | null;
  readmission_risk_tier: string | null;
  payer: string | null;
  caregiver_name: string | null;
  caregiver_availability: string | null;
  is_hero: boolean;
  created_at: string;
};

export type PredictPreviewRequest = {
  age_group?: string;
  gender?: string;
  race?: string;
  ethnicity?: string;
  admission_type?: string;
  med_surg?: string;
  health_service_area?: string;
  zip3?: string;
  ccs_dx?: string;
  ccs_proc?: string;
  apr_drg?: string;
  apr_severity?: number;
  apr_rom?: number;
};

export type PredictPreviewResponse = {
  status: string;
  prediction: number;
  model_version: string;
};
