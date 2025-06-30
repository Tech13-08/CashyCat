import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          monthly_income: number;
          tracking_start_day: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          monthly_income?: number;
          tracking_start_day?: number;
        };
        Update: {
          monthly_income?: number;
          tracking_start_day?: number;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          fixed_amount: number | null;
          percentage_amount: number | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          fixed_amount?: number | null;
          percentage_amount?: number | null;
          color?: string;
        };
        Update: {
          name?: string;
          fixed_amount?: number | null;
          percentage_amount?: number | null;
          color?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          budget_id: string;
          amount: number;
          description: string;
          payment_method: 'bank' | 'credit' | 'cash';
          purchase_date: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          budget_id: string;
          amount: number;
          description: string;
          payment_method: 'bank' | 'credit' | 'cash';
          purchase_date?: string;
        };
        Update: {
          amount?: number;
          description?: string;
          payment_method?: 'bank' | 'credit' | 'cash';
          purchase_date?: string;
        };
      };
      monthly_summaries: {
        Row: {
          id: string;
          user_id: string;
          budget_id: string;
          month: number;
          year: number;
          total_spent: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          budget_id: string;
          month: number;
          year: number;
          total_spent?: number;
        };
        Update: {
          total_spent?: number;
        };
      };
    };
  };
};