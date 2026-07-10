-- Update Silver plan: 3% daily return, 5-day duration (15% max term yield)
UPDATE investment_plans
SET
  description = 'Entry-level plan with a 5-day duration and 3% daily return.',
  daily_roi_percent = 3.0000,
  max_roi_percent = 15.0000,
  duration_days = 5,
  updated_at = now()
WHERE slug = 'silver';
