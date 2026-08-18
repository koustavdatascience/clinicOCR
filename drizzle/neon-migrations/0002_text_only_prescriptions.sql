-- New doctor-approved records retain structured clinical text only.
-- Existing legacy image references remain readable but are no longer required.
ALTER TABLE clinic_prescriptions
  ALTER COLUMN image_key DROP NOT NULL,
  ALTER COLUMN image_url DROP NOT NULL,
  ALTER COLUMN original_filename DROP NOT NULL,
  ALTER COLUMN original_mime_type DROP NOT NULL;
