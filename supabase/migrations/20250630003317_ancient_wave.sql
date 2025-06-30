/*
  # CashyCat Finance Management Database Schema

  1. New Tables
    - `users` - User profiles (extends Supabase auth.users)
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `monthly_income` (decimal)
      - `tracking_start_day` (integer, 1-31)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `budgets` - User budget categories
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `fixed_amount` (decimal, nullable)
      - `percentage_amount` (decimal, nullable)
      - `color` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `purchases` - Individual purchase records
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `budget_id` (uuid, foreign key)
      - `amount` (decimal)
      - `description` (text)
      - `payment_method` (text: 'bank', 'credit', 'cash')
      - `purchase_date` (timestamp)
      - `created_at` (timestamp)
    
    - `monthly_summaries` - Optional monthly budget summaries
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `budget_id` (uuid, foreign key)
      - `month` (integer)
      - `year` (integer)
      - `total_spent` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  monthly_income decimal(10,2) DEFAULT 0,
  tracking_start_day integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  fixed_amount decimal(10,2),
  percentage_amount decimal(5,2),
  color text DEFAULT '#FF6B35',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  description text NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('bank', 'credit', 'cash')),
  purchase_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create monthly summaries table
CREATE TABLE IF NOT EXISTS monthly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  total_spent decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, budget_id, month, year)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for budgets table
CREATE POLICY "Users can read own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for purchases table
CREATE POLICY "Users can read own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own purchases"
  ON purchases FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own purchases"
  ON purchases FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own purchases"
  ON purchases FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for monthly summaries table
CREATE POLICY "Users can read own summaries"
  ON monthly_summaries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own summaries"
  ON monthly_summaries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own summaries"
  ON monthly_summaries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

create policy "Users can delete their own account"
  on users for delete
  using (auth.uid() = id);

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();