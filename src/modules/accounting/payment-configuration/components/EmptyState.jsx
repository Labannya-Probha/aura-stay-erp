import { CreditCard } from 'lucide-react'
import SharedEmptyState from 'src/components/feedback/EmptyState'

export default function EmptyState({ onCreate }) {
  return (
    <SharedEmptyState
      variant="container"
      icon={CreditCard}
      title="No payment terminal configured"
      description="Add a terminal to define merchant references and map card settlements to an approved bank general ledger account."
      action={{
        label: 'Add First Terminal',
        onClick: onCreate,
      }}
      className="min-h-80"
    />
  )
}
