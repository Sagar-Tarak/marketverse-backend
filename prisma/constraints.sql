-- Invariants Prisma cannot express. Safe to run any number of times:
-- `pnpm db:sync` applies this after every `db push`. See prisma/CONSTRAINTS.md.
-- Every statement drops/replaces first, so reruns and renamed rules stay clean.

-- ── CHECK constraints ───────────────────────────────────────────────────────

ALTER TABLE "world_clocks" DROP CONSTRAINT IF EXISTS "world_clocks_values_check";
ALTER TABLE "world_clocks" ADD CONSTRAINT "world_clocks_values_check" CHECK ("current_tick" >= 0 AND "calendar_month" BETWEEN 1 AND 12 AND "calendar_day" BETWEEN 1 AND 31 AND "simulation_speed" > 0 AND "max_catch_up_ticks" >= 0);

ALTER TABLE "game_worlds" DROP CONSTRAINT IF EXISTS "game_worlds_currency_code_check";
ALTER TABLE "game_worlds" ADD CONSTRAINT "game_worlds_currency_code_check" CHECK ("currency_code" ~ '^[A-Z]{3}$');
ALTER TABLE "game_worlds" DROP CONSTRAINT IF EXISTS "game_worlds_starting_capital_check";
ALTER TABLE "game_worlds" ADD CONSTRAINT "game_worlds_starting_capital_check" CHECK ("starting_capital_minor" >= 0);

ALTER TABLE "inventory_balances" DROP CONSTRAINT IF EXISTS "inventory_balances_quantities_check";
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_quantities_check" CHECK ("quantity_on_hand" >= 0 AND "quantity_reserved" >= 0 AND "quantity_reserved" <= "quantity_on_hand");

ALTER TABLE "inventory_reservations" DROP CONSTRAINT IF EXISTS "inventory_reservations_quantity_check";
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_quantity_check" CHECK ("quantity" > 0);

ALTER TABLE "inventory_movements" DROP CONSTRAINT IF EXISTS "inventory_movements_quantity_check";
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "inventory_movements" DROP CONSTRAINT IF EXISTS "inventory_movements_location_check";
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_location_check" CHECK ("source_warehouse_id" IS NOT NULL OR "destination_warehouse_id" IS NOT NULL);

ALTER TABLE "shipment_lines" DROP CONSTRAINT IF EXISTS "shipment_lines_quantity_check";
ALTER TABLE "shipment_lines" ADD CONSTRAINT "shipment_lines_quantity_check" CHECK ("quantity" > 0);

ALTER TABLE "market_orders" DROP CONSTRAINT IF EXISTS "market_orders_quantities_check";
ALTER TABLE "market_orders" ADD CONSTRAINT "market_orders_quantities_check" CHECK ("quantity_total" > 0 AND "quantity_remaining" >= 0 AND "quantity_remaining" <= "quantity_total" AND "limit_price_minor" > 0 AND "reserved_funds_minor" >= 0);

ALTER TABLE "market_trades" DROP CONSTRAINT IF EXISTS "market_trades_values_check";
ALTER TABLE "market_trades" ADD CONSTRAINT "market_trades_values_check" CHECK ("quantity" > 0 AND "unit_price_minor" > 0 AND "gross_amount_minor" >= 0 AND "fees_minor" >= 0 AND "buy_order_id" <> "sell_order_id" AND "buyer_company_id" <> "seller_company_id");

ALTER TABLE "ledger_postings" DROP CONSTRAINT IF EXISTS "ledger_postings_amounts_check";
ALTER TABLE "ledger_postings" ADD CONSTRAINT "ledger_postings_amounts_check" CHECK (("debit_minor_units" > 0 AND "credit_minor_units" = 0) OR ("debit_minor_units" = 0 AND "credit_minor_units" > 0));

ALTER TABLE "financial_accounts" DROP CONSTRAINT IF EXISTS "financial_accounts_owner_check";
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_owner_check" CHECK (("company_id" IS NOT NULL AND "cohort_id" IS NULL) OR ("company_id" IS NULL AND "cohort_id" IS NOT NULL));

ALTER TABLE "company_ownerships" DROP CONSTRAINT IF EXISTS "company_ownerships_owner_check";
ALTER TABLE "company_ownerships" ADD CONSTRAINT "company_ownerships_owner_check" CHECK (
  (("owner_type" = 'USER' AND "owner_user_id" IS NOT NULL AND "owner_company_id" IS NULL)
   OR ("owner_type" = 'COMPANY' AND "owner_company_id" IS NOT NULL AND "owner_user_id" IS NULL))
  AND "ownership_percentage" BETWEEN 0 AND 100
);

ALTER TABLE "population_cohorts" DROP CONSTRAINT IF EXISTS "population_cohorts_counts_check";
ALTER TABLE "population_cohorts" ADD CONSTRAINT "population_cohorts_counts_check" CHECK ("household_count" >= 0 AND "employed_workforce" >= 0 AND "unemployed_workforce" >= 0);

ALTER TABLE "loans" DROP CONSTRAINT IF EXISTS "loans_values_check";
ALTER TABLE "loans" ADD CONSTRAINT "loans_values_check" CHECK ("principal_minor" > 0 AND "outstanding_principal_minor" BETWEEN 0 AND "principal_minor" AND "maturity_tick" > "start_tick");

ALTER TABLE "facility_workforces" DROP CONSTRAINT IF EXISTS "facility_workforces_headcount_check";
ALTER TABLE "facility_workforces" ADD CONSTRAINT "facility_workforces_headcount_check" CHECK ("headcount" >= 0);

ALTER TABLE "supply_contracts" DROP CONSTRAINT IF EXISTS "supply_contracts_values_check";
ALTER TABLE "supply_contracts" ADD CONSTRAINT "supply_contracts_values_check" CHECK ("quantity_per_delivery" > 0 AND "unit_price_minor" > 0 AND "delivery_interval_ticks" > 0);

ALTER TABLE "production_jobs" DROP CONSTRAINT IF EXISTS "production_jobs_values_check";
ALTER TABLE "production_jobs" ADD CONSTRAINT "production_jobs_values_check" CHECK ("batches" > 0 AND "due_tick" >= "start_tick");

ALTER TABLE "transport_routes" DROP CONSTRAINT IF EXISTS "transport_routes_values_check";
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_values_check" CHECK ("distance_km" >= 0 AND "transit_ticks" >= 0 AND "from_city_id" <> "to_city_id");

ALTER TABLE "labor_pools" DROP CONSTRAINT IF EXISTS "labor_pools_values_check";
ALTER TABLE "labor_pools" ADD CONSTRAINT "labor_pools_values_check" CHECK ("workforce" >= 0 AND "employed" BETWEEN 0 AND "workforce" AND "wage_rate_minor" >= 0 AND "productivity" > 0);

ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_transport_factor_check";
ALTER TABLE "products" ADD CONSTRAINT "products_transport_factor_check" CHECK ("transport_factor" >= 0);

ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_credit_score_check";
ALTER TABLE "companies" ADD CONSTRAINT "companies_credit_score_check" CHECK ("credit_score" BETWEEN 0 AND 1000);

ALTER TABLE "tax_assessments" DROP CONSTRAINT IF EXISTS "tax_assessments_values_check";
ALTER TABLE "tax_assessments" ADD CONSTRAINT "tax_assessments_values_check" CHECK ("rate" >= 0 AND "amount_minor" >= 0 AND "taxable_base_minor" >= 0 AND "period_end_tick" >= "period_start_tick");

ALTER TABLE "research_definitions" DROP CONSTRAINT IF EXISTS "research_definitions_values_check";
ALTER TABLE "research_definitions" ADD CONSTRAINT "research_definitions_values_check" CHECK ("cost_minor" >= 0 AND "duration_ticks" > 0);

-- ── Partial unique indexes ──────────────────────────────────────────────────

DROP INDEX IF EXISTS "simulation_ticks_one_running_per_world";
CREATE UNIQUE INDEX "simulation_ticks_one_running_per_world" ON "simulation_ticks"("world_id") WHERE "status" = 'RUNNING';

DROP INDEX IF EXISTS "world_participants_one_owner_per_world";
CREATE UNIQUE INDEX "world_participants_one_owner_per_world" ON "world_participants"("world_id") WHERE "role" = 'OWNER';

DROP INDEX IF EXISTS "markets_world_wide_unique";
CREATE UNIQUE INDEX "markets_world_wide_unique" ON "markets"("world_id", "product_id", "market_type") WHERE "region_id" IS NULL;

DROP INDEX IF EXISTS "economic_indicators_world_wide_unique";
CREATE UNIQUE INDEX "economic_indicators_world_wide_unique" ON "economic_indicators"("world_id", "tick_number", "indicator_code") WHERE "region_id" IS NULL;

DROP INDEX IF EXISTS "company_licenses_world_wide_unique";
CREATE UNIQUE INDEX "company_licenses_world_wide_unique" ON "company_licenses"("world_id", "company_id", "license_id") WHERE "region_id" IS NULL;

-- ── Journal balance: at commit, every posted entry balances per currency ────

CREATE OR REPLACE FUNCTION "assert_journal_entry_balanced"() RETURNS trigger AS $$
DECLARE
  entry_id uuid;
  unbalanced integer;
BEGIN
  IF TG_TABLE_NAME = 'journal_entries' THEN
    entry_id := NEW."id";
  ELSE
    entry_id := NEW."journal_entry_id";
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "journal_entries" WHERE "id" = entry_id AND "status" = 'POSTED') THEN
    RETURN NULL;
  END IF;

  SELECT count(*) INTO unbalanced FROM (
    SELECT 1 FROM "ledger_postings"
    WHERE "journal_entry_id" = entry_id
    GROUP BY "currency_code"
    HAVING sum("debit_minor_units") <> sum("credit_minor_units")
  ) AS t;

  IF unbalanced > 0 OR NOT EXISTS (SELECT 1 FROM "ledger_postings" WHERE "journal_entry_id" = entry_id) THEN
    RAISE EXCEPTION 'journal entry % is not balanced', entry_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "ledger_postings_balanced" ON "ledger_postings";
CREATE CONSTRAINT TRIGGER "ledger_postings_balanced" AFTER INSERT ON "ledger_postings"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "assert_journal_entry_balanced"();

DROP TRIGGER IF EXISTS "journal_entries_balanced" ON "journal_entries";
CREATE CONSTRAINT TRIGGER "journal_entries_balanced" AFTER INSERT OR UPDATE OF "status" ON "journal_entries"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "assert_journal_entry_balanced"();

-- ── Immutability: append-only tables, and posted journal entries ────────────

CREATE OR REPLACE FUNCTION "reject_row_change"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "ledger_postings_append_only" ON "ledger_postings";
CREATE TRIGGER "ledger_postings_append_only" BEFORE UPDATE OR DELETE ON "ledger_postings"
  FOR EACH ROW EXECUTE FUNCTION "reject_row_change"();

DROP TRIGGER IF EXISTS "inventory_movements_append_only" ON "inventory_movements";
CREATE TRIGGER "inventory_movements_append_only" BEFORE UPDATE OR DELETE ON "inventory_movements"
  FOR EACH ROW EXECUTE FUNCTION "reject_row_change"();

CREATE OR REPLACE FUNCTION "protect_posted_journal_entry"() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."status" <> 'DRAFT' THEN
      RAISE EXCEPTION 'posted journal entry % cannot be deleted', OLD."id";
    END IF;
    RETURN OLD;
  END IF;

  IF OLD."status" <> 'DRAFT'
     AND (NEW."status" NOT IN ('POSTED', 'REVERSED')
          OR (to_jsonb(NEW) - 'status') <> (to_jsonb(OLD) - 'status')) THEN
    RAISE EXCEPTION 'posted journal entry % is immutable', OLD."id";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "journal_entries_immutable" ON "journal_entries";
CREATE TRIGGER "journal_entries_immutable" BEFORE UPDATE OR DELETE ON "journal_entries"
  FOR EACH ROW EXECUTE FUNCTION "protect_posted_journal_entry"();
