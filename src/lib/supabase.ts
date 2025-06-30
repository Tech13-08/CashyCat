import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging for deployment
console.log("Environment check:", {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "undefined",
  keyPreview: supabaseAnonKey
    ? `${supabaseAnonKey.substring(0, 20)}...`
    : "undefined",
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables:", {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? "[REDACTED]" : undefined,
  });
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

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
          display_name: string | null;
          theme_preference: string;
        };
        Insert: {
          id: string;
          email: string;
          monthly_income?: number;
          tracking_start_day?: number;
          display_name?: string | null;
          theme_preference?: string;
        };
        Update: {
          monthly_income?: number;
          tracking_start_day?: number;
          display_name?: string | null;
          theme_preference?: string;
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
          payment_method: "bank" | "credit" | "cash";
          purchase_date: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          budget_id: string;
          amount: number;
          description: string;
          payment_method: "bank" | "credit" | "cash";
          purchase_date?: string;
        };
        Update: {
          amount?: number;
          description?: string;
          payment_method?: "bank" | "credit" | "cash";
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
