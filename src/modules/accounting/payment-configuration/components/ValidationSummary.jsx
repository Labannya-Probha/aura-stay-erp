import { AlertCircle } from 'lucide-react'

export default function ValidationSummary({ errors = {} }) {
  const messages = Object.values(errors).filter(Boolean)
  if (!messages.length) return null

  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {messages.map((message) => <li key={message}>{message}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
