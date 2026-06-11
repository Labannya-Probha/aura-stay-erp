-- Migration: Add Discount Policy Support to Reservations
-- Date: 2026-06-11
-- Description: Adds discount_pct and discount_reason columns to enable per-reservation discount policies

-- Add discount percentage column (default 0 = no discount)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS discount_pct NUMERIC(5,2) DEFAULT 0;

-- Add discount reason column (optional, e.g., "Corporate rate", "Early bird", "Referral")
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS discount_reason TEXT;

-- Create index for faster lookups on discounted reservations
CREATE INDEX IF NOT EXISTS idx_reservations_discount_pct ON reservations(discount_pct) WHERE discount_pct > 0;

-- Add comment for documentation
COMMENT ON COLUMN reservations.discount_pct IS 'Discount percentage (0-100) applied to room charges. Applied before service charge, SD, and VAT calculations.';
COMMENT ON COLUMN reservations.discount_reason IS 'Optional reason for the discount, e.g., Corporate rate, Early bird promotion, Referral, etc.';

-- Verify the columns were created
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'reservations' AND column_name IN ('discount_pct', 'discount_reason');
