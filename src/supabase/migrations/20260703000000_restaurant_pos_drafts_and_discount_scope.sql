DO $$
BEGIN
  ALTER TABLE public.pos_orders
    ADD COLUMN IF NOT EXISTS discount_scope text NOT NULL DEFAULT 'GLOBAL',
    ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'PERCENT',
    ADD COLUMN IF NOT EXISTS discount_value numeric(12,2) NOT NULL DEFAULT 0;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.pos_orders
    DROP CONSTRAINT IF EXISTS pos_orders_discount_scope_check;
  ALTER TABLE public.pos_orders
    ADD CONSTRAINT pos_orders_discount_scope_check
      CHECK (discount_scope IN ('GLOBAL', 'FOOD', 'BEVERAGE'));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.pos_orders
    DROP CONSTRAINT IF EXISTS pos_orders_discount_type_check;
  ALTER TABLE public.pos_orders
    ADD CONSTRAINT pos_orders_discount_type_check
      CHECK (discount_type IN ('PERCENT', 'FIXED'));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.pos_orders
    DROP CONSTRAINT IF EXISTS pos_orders_status_check;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.pos_orders
    ADD CONSTRAINT pos_orders_status_check
      CHECK (status IN (
        'DRAFT',
        'OPEN',
        'ACCEPTED',
        'READY',
        'SERVED',
        'SETTLED',
        'CHARGED_TO_ROOM',
        'STAFF_DUE',
        'DUE',
        'CANCELLED'
      ));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;
