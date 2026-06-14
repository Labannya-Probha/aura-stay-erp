import { createPortal } from 'react-dom'
import { X, Printer } from 'lucide-react'

// Renders an official document into #print-root (print target) + a screen preview modal
export default function PrintPortal({ title, onClose, children }) {
  return (
    <>
      {/* A4 print styling — injected here so no separate CSS file is needed */}
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          /* hide everything, then show only the print target */
          body * { visibility: hidden !important; }
          #print-root, #print-root * { visibility: visible !important; }
          #print-root {
            position: absolute; left: 0; top: 0;
            width: 186mm;            /* A4 210mm − 2×12mm margin */
          }
          .no-print { display: none !important; }
          #print-root .print-doc {
            width: 186mm !important; max-width: 186mm !important;
            margin: 0 auto !important; font-size: 11px; color: #000 !important;
          }
          #print-root .print-doc * { box-sizing: border-box; }
          #print-root .print-doc table { width: 100% !important; border-collapse: collapse; }
          #print-root .print-doc img { max-width: 100%; }
          #print-root .print-doc tr,
          #print-root .print-doc table,
          #print-root .print-doc svg { page-break-inside: avoid; }
        }
      `}</style>

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
          <div className="p-6 overflow-auto" style={{ fontSize: 12, color: '#000' }}>
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
