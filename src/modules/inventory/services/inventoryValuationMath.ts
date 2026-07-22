export type ValuationMethod = 'FIFO' | 'WEIGHTED_AVERAGE'

export interface FifoLayer {
  id: string
  purchasedAt: string
  remainingQty: number
  unitCost: number
}

export interface FifoAllocation {
  layerId: string
  qty: number
  unitCost: number
  totalCost: number
}

export interface FifoConsumptionResult {
  allocations: FifoAllocation[]
  totalCost: number
  effectiveUnitCost: number
  remainingLayers: FifoLayer[]
}

export interface WeightedAverageState {
  qtyOnHand: number
  avgUnitCost: number
  inventoryValue: number
}

const round = (value: number, scale = 8): number => {
  const factor = 10 ** scale
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/**
 * Deterministic FIFO depletion for unit tests and simulation.
 * Production postings are executed in Postgres for ACID guarantees.
 */
export function consumeFifoLayers(
  layers: FifoLayer[],
  qtyToConsume: number,
): FifoConsumptionResult {
  if (qtyToConsume <= 0) throw new Error('Quantity to consume must be > 0.')

  const sorted = [...layers].sort((a, b) => {
    const aTime = new Date(a.purchasedAt).getTime()
    const bTime = new Date(b.purchasedAt).getTime()
    if (aTime !== bTime) return aTime - bTime
    return a.id.localeCompare(b.id)
  })

  const available = sorted.reduce((sum, layer) => sum + layer.remainingQty, 0)
  if (available < qtyToConsume) {
    throw new Error(`Insufficient FIFO quantity. Available=${available}, requested=${qtyToConsume}`)
  }

  let remaining = qtyToConsume
  let totalCost = 0
  const allocations: FifoAllocation[] = []

  for (const layer of sorted) {
    if (remaining <= 0) break
    if (layer.remainingQty <= 0) continue

    const consumeQty = Math.min(layer.remainingQty, remaining)
    const lineCost = round(consumeQty * layer.unitCost, 8)

    allocations.push({
      layerId: layer.id,
      qty: round(consumeQty, 6),
      unitCost: round(layer.unitCost, 8),
      totalCost: lineCost,
    })

    layer.remainingQty = round(layer.remainingQty - consumeQty, 6)
    remaining = round(remaining - consumeQty, 6)
    totalCost = round(totalCost + lineCost, 8)
  }

  return {
    allocations,
    totalCost,
    effectiveUnitCost: round(totalCost / qtyToConsume, 8),
    remainingLayers: sorted,
  }
}

export function applyWeightedAverageReceipt(
  state: WeightedAverageState,
  receiptQty: number,
  receiptUnitCost: number,
): WeightedAverageState {
  if (receiptQty <= 0) throw new Error('Receipt quantity must be > 0.')
  if (receiptUnitCost < 0) throw new Error('Receipt unit cost must be >= 0.')

  const receiptValue = round(receiptQty * receiptUnitCost, 8)
  const nextQty = round(state.qtyOnHand + receiptQty, 6)
  const nextValue = round(state.inventoryValue + receiptValue, 8)
  const nextAvg = nextQty === 0 ? 0 : round(nextValue / nextQty, 8)

  return {
    qtyOnHand: nextQty,
    inventoryValue: nextValue,
    avgUnitCost: nextAvg,
  }
}

export function applyWeightedAverageIssue(
  state: WeightedAverageState,
  issueQty: number,
): { nextState: WeightedAverageState; totalCost: number; effectiveUnitCost: number } {
  if (issueQty <= 0) throw new Error('Issue quantity must be > 0.')
  if (state.qtyOnHand < issueQty) {
    throw new Error(`Insufficient stock. Available=${state.qtyOnHand}, requested=${issueQty}`)
  }

  const totalCost = round(issueQty * state.avgUnitCost, 8)
  const nextQty = round(state.qtyOnHand - issueQty, 6)
  const nextValue = nextQty === 0 ? 0 : round(state.inventoryValue - totalCost, 8)
  const nextAvg = nextQty === 0 ? 0 : round(nextValue / nextQty, 8)

  return {
    nextState: {
      qtyOnHand: nextQty,
      inventoryValue: nextValue,
      avgUnitCost: nextAvg,
    },
    totalCost,
    effectiveUnitCost: round(totalCost / issueQty, 8),
  }
}
