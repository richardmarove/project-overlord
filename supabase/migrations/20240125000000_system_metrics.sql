-- Create system_metrics table
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  value FLOAT NOT NULL,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all metrics" ON public.system_metrics 
  FOR SELECT USING (
    auth.role() = 'authenticated' AND public.is_admin()
  );

CREATE POLICY "Admins can insert metrics" ON public.system_metrics 
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND public.is_admin()
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS system_metrics_metric_name_created_at_idx ON public.system_metrics(metric_name, created_at DESC);
