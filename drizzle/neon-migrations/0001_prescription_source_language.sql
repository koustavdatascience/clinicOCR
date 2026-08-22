ALTER TABLE clinic_prescriptions
  ADD COLUMN IF NOT EXISTS source_language_code VARCHAR(24),
  ADD COLUMN IF NOT EXISTS source_language_name VARCHAR(80),
  ADD COLUMN IF NOT EXISTS source_script VARCHAR(48);
