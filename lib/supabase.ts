import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Client for browser-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (has elevated permissions)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Database types
export interface Credit {
  id: string;
  email: string;
  credits_remaining: number;
  trial_used: boolean;
  created_at: string;
  updated_at: string;
}

export interface Script {
  id: string;
  email: string;
  title: string;
  file_name: string;
  page_count: number | null;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  raw_text: string | null;
  analysis: any;
  error_message: string | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface ContentQueue {
  id: string;
  platform: 'twitter' | 'linkedin' | 'blog';
  content: string;
  title: string | null;
  slug: string | null;
  status: 'queued' | 'posted' | 'failed';
  scheduled_for: string | null;
  posted_at: string | null;
  external_id: string | null;
  created_at: string;
}

export interface DailyStats {
  id: string;
  date: string;
  revenue: number;
  scripts_analyzed: number;
  signups: number;
  refunds: number;
}

export interface Review {
  id: string;
  email: string;
  imdb_url: string;
  testimonial: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
}
