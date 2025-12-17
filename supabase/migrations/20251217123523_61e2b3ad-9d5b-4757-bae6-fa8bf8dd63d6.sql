-- Create table for feedback survey responses
CREATE TABLE public.feedback_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Question 1: Context
  pet_type TEXT NOT NULL,
  pet_type_other TEXT,
  usage_time TEXT NOT NULL,
  
  -- Question 2: NPS
  nps_score INTEGER NOT NULL CHECK (nps_score >= 0 AND nps_score <= 10),
  
  -- Question 3: Expectations
  expectations TEXT NOT NULL,
  expectations_reason TEXT,
  
  -- Question 4: Motivation (stored as array, max 2)
  motivations TEXT[] NOT NULL,
  motivation_other TEXT,
  
  -- Question 5: Strengths and Weaknesses
  liked_most TEXT NOT NULL,
  would_change TEXT NOT NULL,
  
  -- Question 6: Acceptance
  pet_acceptance TEXT NOT NULL,
  rejection_action TEXT,
  
  -- Question 7: Repurchase
  would_repurchase TEXT NOT NULL,
  no_repurchase_reason TEXT,
  
  -- Question 8: Ideal Product
  ideal_product TEXT
);

-- Enable Row Level Security
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (public survey)
CREATE POLICY "Anyone can submit feedback"
ON public.feedback_responses
FOR INSERT
WITH CHECK (true);

-- Only allow reading for authenticated users (admin)
CREATE POLICY "Authenticated users can read feedback"
ON public.feedback_responses
FOR SELECT
TO authenticated
USING (true);