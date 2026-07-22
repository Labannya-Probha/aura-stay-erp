import { describe, expect, it } from 'vitest'
import {
  applyWeightedAverageIssue,
  applyWeightedAverageReceipt,
  consumeFifoLayers,
} from '../inventoryValuationMath'

describe('inventoryValuationMath FIFO', () => {
  it('consumes in chronological FIFO order with exact layer allocations', () => {
    const result = consumeFifoLayers(
      [
        { id: 'L1', purchasedAt: '2026-01-02T00:00:00Z', remainingQty: 10, unitCost: 100 },
        { id: 'L2', purchasedAt: '2026-01-03T00:00:00Z', remainingQty: 10, unitCost: 120 },
      ],
      12,
    )

    expect(result.totalCost).toBe(1240)
    expect(result.effectiveUnitCost).toBeCloseTo(103.33333333, 8)
    expect(result.allocations).toEqual([
      { layerId: 'L1', qty: 10, unitCost: 100, totalCost: 1000 },
      { layerId: 'L2', qty: 2, unitCost: 120, totalCost: 240 },
    ])
    expect(result.remainingLayers.find((l) => l.id === 'L1')?.remainingQty).toBe(0)
    expect(result.remainingLayers.find((l) => l.id === 'L2')?.remainingQty).toBe(8)
  })

  it('throws when consuming more than available', () => {
    expect(() =>
      consumeFifoLayers(
        [{ id: 'L1', purchasedAt: '2026-01-02T00:00:00Z', remainingQty: 5, unitCost: 90 }],
        7,
      ),
    ).toThrow('Insufficient FIFO quantity')
  })
})

describe('inventoryValuationMath weighted average', () => {
  it('recalculates weighted average after receipt', () => {
    const next = applyWeightedAverageReceipt(
      { qtyOnHand: 10, avgUnitCost: 100, inventoryValue: 1000 },
      5,
      130,
    )

    expect(next.qtyOnHand).toBe(15)
    expect(next.inventoryValue).toBe(1650)
    expect(next.avgUnitCost).toBe(110)
  })

  it('issues stock at current weighted average and keeps state consistent', () => {
    const { nextState, totalCost, effectiveUnitCost } = applyWeightedAverageIssue(
      { qtyOnHand: 20, avgUnitCost: 110, inventoryValue: 2200 },
      6,
    )

    expect(totalCost).toBe(660)
    expect(effectiveUnitCost).toBe(110)
    expect(nextState.qtyOnHand).toBe(14)
    expect(nextState.inventoryValue).toBe(1540)
    expect(nextState.avgUnitCost).toBe(110)
  })

  it('zeros average and value when issuing final quantity', () => {
    const { nextState } = applyWeightedAverageIssue(
      { qtyOnHand: 3, avgUnitCost: 90, inventoryValue: 270 },
      3,
    )

    expect(nextState.qtyOnHand).toBe(0)
    expect(nextState.inventoryValue).toBe(0)
    expect(nextState.avgUnitCost).toBe(0)
  })
})
