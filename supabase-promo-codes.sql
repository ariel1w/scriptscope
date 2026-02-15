-- Promo Codes Table
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  uses_remaining INTEGER CHECK (uses_remaining IS NULL OR uses_remaining >= 0),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast code lookups
CREATE INDEX idx_promo_codes_code ON promo_codes(code);

-- Add some example promo codes (optional)
INSERT INTO promo_codes (code, discount_percent, uses_remaining) VALUES
  ('LAUNCH50', 50, 100),
  ('FREEFIRST', 100, 50),
  ('FIRST10', 74, NULL),
  ('SCRIPTSCOPE25', 25, NULL);

-- Function to validate and use promo code
CREATE OR REPLACE FUNCTION use_promo_code(promo_code TEXT)
RETURNS TABLE(valid BOOLEAN, discount_percent INTEGER) AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- Check for master code (case insensitive)
  IF LOWER(promo_code) = 'arielweisbrod' THEN
    RETURN QUERY SELECT TRUE, 100;
    RETURN;
  END IF;

  -- Look up the code
  SELECT * INTO code_record
  FROM promo_codes
  WHERE LOWER(code) = LOWER(promo_code);

  -- Code doesn't exist
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  -- Check if uses remaining
  IF code_record.uses_remaining IS NOT NULL AND code_record.uses_remaining <= 0 THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  -- Decrement uses if not unlimited
  IF code_record.uses_remaining IS NOT NULL THEN
    UPDATE promo_codes
    SET uses_remaining = uses_remaining - 1
    WHERE id = code_record.id;
  END IF;

  -- Return success
  RETURN QUERY SELECT TRUE, code_record.discount_percent;
END;
$$ LANGUAGE plpgsql;
