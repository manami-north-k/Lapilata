/*
  # Initial Schema Setup for Receipt Management System

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key)
      - `date` (date, not null)
      - `amount` (numeric, not null)
      - `category` (text)
      - `description` (text)
      - `notes` (text)
      - `is_fixed` (boolean)
      - `receipt_url` (text)
      - `created_at` (timestamptz)
      - `account_title` (text)
      - `payment_method` (text)
      - `is_income` (boolean)
      - `user_id` (uuid, foreign key to auth.users)

    - `daily_sales`
      - `id` (uuid, primary key)
      - `date` (date, not null)
      - `amount` (numeric, not null)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)

    - `fixed_expenses`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `amount` (numeric, not null)
      - `category` (text)
      - `due_day` (integer)
      - `account_title` (text)
      - `is_active` (boolean)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  amount numeric NOT NULL,
  category text,
  description text,
  notes text,
  is_fixed boolean DEFAULT false,
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  account_title text,
  payment_method text,
  is_income boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Create daily_sales table
CREATE TABLE IF NOT EXISTS daily_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  amount numeric NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create fixed_expenses table
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric NOT NULL,
  category text,
  due_day integer,
  account_title text,
  is_active boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own expenses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own daily sales"
  ON daily_sales
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own fixed expenses"
  ON fixed_expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);