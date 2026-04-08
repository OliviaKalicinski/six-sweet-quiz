ALTER TABLE public.feedback_responses
  ADD COLUMN IF NOT EXISTS survey_path text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS survey_answers jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS end_state text;