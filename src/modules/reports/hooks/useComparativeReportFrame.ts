import { useMemo } from 'react'

type ComparativeReportFrameInput = {
  currentLabel: string
  previousLabel?: string
  budgetLabel?: string
  currentValue: number | string | null | undefined
  previousValue?: number | string | null | undefined
  budgetValue?: number | string | null | undefined
  currency?: string
}

function toNumber(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatMoney(value: number, currency: string) {
  const prefix = currency.toUpperCase() === 'USD' ? '$' : '৳'
  return `${prefix}${value.toLocaleString('en-BD')}`
}

export function useComparativeReportFrame({
  currentLabel,
  previousLabel = 'Prior Period',
  budgetLabel = 'Budget',
  currentValue,
  previousValue,
  budgetValue,
  currency = 'BDT',
}: ComparativeReportFrameInput) {
  return useMemo(() => {
    const current = toNumber(currentValue)
    const previous = toNumber(previousValue)
    const budget = toNumber(budgetValue)
    const variance = current - previous
    const budgetVariance = budgetValue == null ? null : current - budget

    return {
      labels: {
        current: currentLabel,
        previous: previousLabel,
        budget: budgetLabel,
      },
      currency,
      values: {
        current,
        previous,
        budget,
        variance,
        variancePercent: previous !== 0 ? (variance / Math.abs(previous)) * 100 : null,
        budgetVariance,
      },
      formatted: {
        current: formatMoney(current, currency),
        previous: formatMoney(previous, currency),
        budget: formatMoney(budget, currency),
      },
    }
  }, [
    budgetLabel,
    budgetValue,
    बजcurrency,
    currentLabel,
    currentValue,
    previousLabel,
    previousValue,
    budgetValue,
  ])
}
