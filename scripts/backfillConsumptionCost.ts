import { Pool, type PoolClient } from 'pg'

type AccountPair = {
  cogsAccountId: string | null
  inventoryAccountId: string | null
}

type BackfillOptions = {
  tenantId: string | null
  fromDate: string | null
  toDate: string | null
  dryRun: boolean
  postJournal: boolean
}

type ConsumptionLineRow = {
  id: string
  tenant_id: string
  item_id: string
  qty: number
  entry_date: string
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

function parseArgs(argv: string[]): BackfillOptions {
  const getArg = (name: string): string | null => {
    const hit = argv.find((arg) => arg.startsWith(`${name}=`))
    return hit ? hit.slice(name.length + 1) : null
  }

  const hasFlag = (name: string): boolean => argv.includes(name)

  const tenantId = getArg('--tenantId')
  const fromDate = getArg('--fromDate')
  const toDate = getArg('--toDate')
  const dryRun = hasFlag('--dryRun') || getArg('--dryRun') === 'true'
  const postJournal = hasFlag('--postJournal') || getArg('--postJournal') === 'true'

  return { tenantId, fromDate, toDate, dryRun, postJournal }
}

async function getTenantAccounts(client: PoolClient, tenantId: string): Promise<AccountPair> {
  const { rows } = await client.query<{ id: string; account_type: string }>(
    `
      SELECT id, account_type
      FROM accounts
      WHERE tenant_id = $1
        AND account_type IN ('COGS', 'INVENTORY_ASSET');
    `,
    [tenantId],
  )

  const cogs = rows.find((r) => r.account_type === 'COGS')
  const inv = rows.find((r) => r.account_type === 'INVENTORY_ASSET')

  return {
    cogsAccountId: cogs?.id ?? null,
    inventoryAccountId: inv?.id ?? null,
  }
}

async function alreadyBackfilled(client: PoolClient, lineId: string): Promise<boolean> {
  const { rows } = await client.query<{ exists: boolean }>(
    `
      SELECT EXISTS(
        SELECT 1
        FROM journal_entries je
        WHERE je.reference_type = 'HISTORICAL_CONSUMPTION_BACKFILL'
          AND je.reference_id = $1
      ) AS exists;
    `,
    [lineId],
  )

  return Boolean(rows[0]?.exists)
}

async function calculateWac(
  client: PoolClient,
  tenantId: string,
  itemId: string,
  entryDate: string,
): Promise<number> {
  const { rows } = await client.query<{ calculated_wac: string | null }>(
    `
      SELECT COALESCE(SUM(gi.qty * gi.unit_cost) / NULLIF(SUM(gi.qty), 0), 0)::text AS calculated_wac
      FROM grn_items gi
      JOIN goods_receipts gr ON gr.id = gi.grn_id
      WHERE gr.tenant_id = $1
        AND gi.item_id = $2
        AND gr.grn_date <= $3;
    `,
    [tenantId, itemId, entryDate],
  )

  return Number.parseFloat(rows[0]?.calculated_wac ?? '0')
}

async function fetchUncostedLines(
  client: PoolClient,
  options: BackfillOptions,
): Promise<ConsumptionLineRow[]> {
  const { rows } = await client.query<ConsumptionLineRow>(
    `
      SELECT cl.id, ce.tenant_id, cl.item_id, cl.qty, ce.entry_date
      FROM consumption_lines cl
      JOIN consumption_entries ce ON ce.id = cl.consumption_id
      WHERE (cl.unit_cost IS NULL OR cl.unit_cost = 0)
        AND ($1::uuid IS NULL OR ce.tenant_id = $1::uuid)
        AND ($2::date IS NULL OR ce.entry_date >= $2::date)
        AND ($3::date IS NULL OR ce.entry_date <= $3::date)
      ORDER BY ce.entry_date ASC, cl.id ASC;
    `,
    [options.tenantId, options.fromDate, options.toDate],
  )

  return rows
}

async function runHistoricalBackfill(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const client = await pool.connect()

  let processed = 0
  let updated = 0
  let skippedNoWac = 0
  let skippedNoAccounts = 0
  let skippedDuplicateVoucher = 0
  let totalBackfilledValue = 0

  const accountCache = new Map<string, AccountPair>()

  try {
    console.log('--- Starting Historical Consumption Cost Backfill ---')
    console.log(
      JSON.stringify(
        {
          tenantId: options.tenantId ?? 'ALL',
          fromDate: options.fromDate,
          toDate: options.toDate,
          dryRun: options.dryRun,
          postJournal: options.postJournal,
        },
        null,
        2,
      ),
    )

    await client.query('BEGIN')

    const uncostedLines = await fetchUncostedLines(client, options)
    console.log(`Found ${uncostedLines.length} line(s) needing cost backfill.`)

    for (const line of uncostedLines) {
      processed += 1
      const { id, tenant_id: tenantId, item_id: itemId, qty, entry_date: entryDate } = line

      const unitCost = await calculateWac(client, tenantId, itemId, entryDate)
      if (!Number.isFinite(unitCost) || unitCost <= 0) {
        skippedNoWac += 1
        console.warn(
          `[Skip] No valid WAC for line ${id}, tenant=${tenantId}, item=${itemId}, date=${entryDate}`,
        )
        continue
      }

      const totalCost = Number((qty * unitCost).toFixed(6))

      if (!options.dryRun) {
        await client.query(
          `
            UPDATE consumption_lines
            SET unit_cost = $1,
                line_cost = $2
            WHERE id = $3;
          `,
          [unitCost, totalCost, id],
        )
      }

      updated += 1
      totalBackfilledValue += totalCost

      if (!options.postJournal) {
        console.log(
          `[Backfilled] line=${id} qty=${qty} unit_cost=${unitCost.toFixed(6)} total=${totalCost.toFixed(6)} (journal=OFF)`,
        )
        continue
      }

      const duplicate = await alreadyBackfilled(client, id)
      if (duplicate) {
        skippedDuplicateVoucher += 1
        console.warn(`[Skip] Voucher already exists for line ${id}`)
        continue
      }

      let accounts = accountCache.get(tenantId)
      if (!accounts) {
        accounts = await getTenantAccounts(client, tenantId)
        accountCache.set(tenantId, accounts)
      }

      if (!accounts.cogsAccountId || !accounts.inventoryAccountId) {
        skippedNoAccounts += 1
        console.warn(`[Skip] Missing COGS or INVENTORY_ASSET account for tenant ${tenantId}`)
        continue
      }

      if (!options.dryRun) {
        const { rows } = await client.query<{ id: string }>(
          `
            INSERT INTO journal_entries (
              tenant_id,
              entry_date,
              description,
              reference_type,
              reference_id,
              status
            )
            VALUES ($1, $2, $3, 'HISTORICAL_CONSUMPTION_BACKFILL', $4, 'POSTED')
            RETURNING id;
          `,
          [tenantId, entryDate, `Backfill COGS for consumption line ${id}`, id],
        )
        const journalEntryId = rows[0]?.id

        await client.query(
          `
            INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit)
            VALUES
              ($1, $2, $3, 0),
              ($1, $4, 0, $3);
          `,
          [journalEntryId, accounts.cogsAccountId, totalCost, accounts.inventoryAccountId],
        )
      }

      console.log(
        `[Backfilled] line=${id} qty=${qty} unit_cost=${unitCost.toFixed(6)} total=${totalCost.toFixed(6)} (journal=ON)`,
      )
    }

    if (options.dryRun) {
      await client.query('ROLLBACK')
      console.log('Dry run complete. Transaction rolled back.')
    } else {
      await client.query('COMMIT')
      console.log('Transaction committed.')
    }

    console.log('--- Historical Backfill Summary ---')
    console.log(
      JSON.stringify(
        {
          processed,
          updated,
          skippedNoWac,
          skippedNoAccounts,
          skippedDuplicateVoucher,
          totalBackfilledValue: Number(totalBackfilledValue.toFixed(6)),
          dryRun: options.dryRun,
          postJournal: options.postJournal,
        },
        null,
        2,
      ),
    )
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error during historical backfill. Rolled back.', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runHistoricalBackfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
