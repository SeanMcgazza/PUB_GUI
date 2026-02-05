-- ============================================================
-- Onboarding Schema Additions
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add role column to profiles (for onboarding role selection)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role text DEFAULT '';

-- Add business_hours JSONB column to booking_settings
-- Format: [{ "day": 0, "open": false, "openTime": "09:00", "closeTime": "18:00" }, ...]
-- day: 0=Sunday, 1=Monday, ..., 6=Saturday
ALTER TABLE public.booking_settings 
  ADD COLUMN IF NOT EXISTS business_hours jsonb DEFAULT '[]'::jsonb;
