-- Add customer_name column to feedback_responses table
ALTER TABLE public.feedback_responses
ADD COLUMN customer_name text NOT NULL DEFAULT '';