import { createPortal } from 'react-dom'
import { X, Printer } from 'lucide-react'

// Renders an official document into #print-root (print target) + a screen preview modal
export default function PrintPortal({ title, onClose, children }) {
  return (
    <>
      {createPortal(<div className="print-doc">{children}</div>, document.getElementById('print-root'))}
      <div className="fixed inset-0 bg-ink/60 z-50 flex items-start justify-center overflow-auto p-6 no-print">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-4">
          <div className="flex items-center justify-between px-5 py-3 border-b border-leaf sticky top-0 bg-white rounded-t-xl z-10">
            <h3 className="font-display font-semibold text-pine">{title}</h3>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print / Save PDF
              </button>
              <button className="btn-ghost" onClick={onClose}>
                <X size={16} /> Close
              </button>
            </div>
          </div>
          <div className="p-6 overflow-auto print-doc" style={{ fontSize: 12, color: '#000' }}>
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
