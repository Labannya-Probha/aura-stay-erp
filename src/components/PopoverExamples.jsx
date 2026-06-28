/**
 * Example component showing all popover system features
 * 
 * This is a comprehensive example demonstrating:
 * - Simple notifications (success, info, warning, error)
 * - Confirmation dialogs
 * - Delete confirmations
 * - Custom popovers
 */

import { usePopoverActions } from '../hooks/usePopoverActions'
import { Button } from './ui/button'

export function PopoverExamples() {
  const {
    success,
    info,
    warning,
    error,
    confirmDelete,
    confirmSave,
    confirmAction,
  } = usePopoverActions()

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Section: Notifications */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📢 Notification Examples</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="sm"
            onClick={() => success('Changes saved successfully!')}
            className="bg-forest hover:bg-forest/90"
          >
            Success
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => info('Did you know? You can use keyboard shortcuts.')}
          >
            Info
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => warning('Please review your entries before submitting.')}
          >
            Warning
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => error('Failed to process your request. Try again later.')}
          >
            Error
          </Button>
        </div>
      </section>

      {/* Section: Confirmations */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">✅ Confirmation Dialogs</h2>
        <div className="space-y-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              confirmDelete('User: John Doe',
                () => success('User deleted successfully!'),
                () => info('Deletion cancelled')
              )
            }
            className="w-full text-left"
          >
            Delete Confirmation
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              confirmSave('5 unsaved changes',
                () => success('Changes saved!'),
                () => info('Changes discarded')
              )
            }
            className="w-full text-left"
          >
            Save Confirmation
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              confirmAction(
                'Generate Report',
                'Generate monthly analytics report? This may take a few minutes.',
                () => success('Report generation started...'),
                () => info('Report generation cancelled'),
                'Generate',
                'Cancel'
              )
            }
            className="w-full text-left"
          >
            Custom Action
          </Button>
        </div>
      </section>

      {/* Section: Usage Instructions */}
      <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 How to Use</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Import <code className="bg-white px-1 rounded">usePopoverActions</code> in your component</li>
          <li>Call hook to get notification methods: <code className="bg-white px-1 rounded">const {'{'} success, error {'}'} = usePopoverActions()</code></li>
          <li>Use in event handlers: <code className="bg-white px-1 rounded">onClick={{'()'}} =&gt; success('Message')}</code></li>
          <li>For confirmations, provide callbacks for onConfirm and onCancel</li>
          <li>Customize appearance via theme colors in PopoverDisplay.jsx</li>
        </ol>
      </section>

      {/* Section: Common Patterns */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">🔧 Common Patterns</h2>
        <div className="space-y-3 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <p className="font-mono text-xs mb-2 text-gray-600">After Form Submit:</p>
            <code className="text-xs text-gray-700">
{`async function handleSubmit(data) {
  try {
    const result = await api.save(data)
    success('Saved successfully!')
  } catch (err) {
    error(err.message)
  }
}`}
            </code>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="font-mono text-xs mb-2 text-gray-600">Destructive Action:</p>
            <code className="text-xs text-gray-700">
{`function handleDelete(item) {
  confirmDelete(item.name, () => {
    api.delete(item.id)
    success('Deleted!')
  })
}`}
            </code>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="font-mono text-xs mb-2 text-gray-600">Validation:</p>
            <code className="text-xs text-gray-700">
{`if (!isValid) {
  warning('Please fill all required fields')
  return
}`}
            </code>
          </div>
        </div>
      </section>
    </div>
  )
}
