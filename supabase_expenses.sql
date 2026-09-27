-- ==============================================================================
-- ModtyTasks / DocFlow: Supabase Expenses Schema
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  next_billing_date DATE,
  start_date DATE,
  end_date DATE,
  vendor TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method TEXT,
  url TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Allow read & write access for authenticated & anonymous users
CREATE POLICY "Allow all access to expenses"
ON public.expenses
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable Supabase Realtime for expenses table
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
