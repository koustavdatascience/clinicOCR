DO $$ BEGIN
  CREATE TYPE clinic_user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS clinic_users (
  id SERIAL PRIMARY KEY,
  open_id VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  login_method VARCHAR(64),
  role clinic_user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_signed_in TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_patients (
  id BIGSERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  name VARCHAR(180) NOT NULL,
  age INTEGER CHECK (age IS NULL OR age BETWEEN 0 AND 130),
  gender VARCHAR(48),
  phone VARCHAR(40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_prescriptions (
  id BIGSERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  patient_id BIGINT NOT NULL REFERENCES clinic_patients(id) ON DELETE CASCADE,
  image_key TEXT NOT NULL,
  image_url TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  original_mime_type VARCHAR(96) NOT NULL,
  raw_ocr TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  ai_summary TEXT NOT NULL,
  medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
  important_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  doctor_notes TEXT,
  important BOOLEAN NOT NULL DEFAULT FALSE,
  ocr_confidence INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS clinic_patients_owner_idx ON clinic_patients (owner_id);
CREATE INDEX IF NOT EXISTS clinic_patients_owner_name_idx ON clinic_patients (owner_id, name);
CREATE INDEX IF NOT EXISTS clinic_patients_owner_phone_idx ON clinic_patients (owner_id, phone);
CREATE INDEX IF NOT EXISTS clinic_prescriptions_owner_idx ON clinic_prescriptions (owner_id);
CREATE INDEX IF NOT EXISTS clinic_prescriptions_patient_created_idx ON clinic_prescriptions (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS clinic_prescriptions_owner_created_idx ON clinic_prescriptions (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS clinic_prescriptions_patient_important_idx ON clinic_prescriptions (patient_id, important DESC);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clinic_patients_owner_fk') THEN
    ALTER TABLE clinic_patients ADD CONSTRAINT clinic_patients_owner_fk FOREIGN KEY (owner_id) REFERENCES clinic_users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clinic_prescriptions_owner_fk') THEN
    ALTER TABLE clinic_prescriptions ADD CONSTRAINT clinic_prescriptions_owner_fk FOREIGN KEY (owner_id) REFERENCES clinic_users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION clinic_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clinic_users_updated_at_trigger ON clinic_users;
CREATE TRIGGER clinic_users_updated_at_trigger BEFORE UPDATE ON clinic_users FOR EACH ROW EXECUTE FUNCTION clinic_set_updated_at();
DROP TRIGGER IF EXISTS clinic_patients_updated_at_trigger ON clinic_patients;
CREATE TRIGGER clinic_patients_updated_at_trigger BEFORE UPDATE ON clinic_patients FOR EACH ROW EXECUTE FUNCTION clinic_set_updated_at();
DROP TRIGGER IF EXISTS clinic_prescriptions_updated_at_trigger ON clinic_prescriptions;
CREATE TRIGGER clinic_prescriptions_updated_at_trigger BEFORE UPDATE ON clinic_prescriptions FOR EACH ROW EXECUTE FUNCTION clinic_set_updated_at();
