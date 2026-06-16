import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, Download } from 'lucide-react'

export default function PrintPortal({ title, onClose, children, type = 'A4' }) {
  const [portalNode, setPortalNode] = useState(null)

  useEffect(() => {
    const node = document.createElement('div')
    node.id = 'print-portal-container'
    document.body.appendChild(node)
    setPortalNode(node)

    const style = document.createElement('style')
    style.id = '__print-portal-page-style__'
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      @media print {
        body > div:not(#print-portal-container) { display: none !important; }
        #print-root { font-family: 'Inter', sans-serif !important; }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.getElementById('__print-portal-page-style__')?.remove()
      if (node.parentNode) node.parentNode.removeChild(node)
    }
  }, [type])

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-start justify-center overflow-auto p-6">
      <div className="bg-white w-full max-w-3xl my-4 border border-gray-300">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-300 sticky top-0 bg-white z-10 no-print">
          <h3 className="font-semibold text-gray-800 font-sans">{title}</h3>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700" onClick={() => window.print()}>
              <Download size={14} /> Export PDF
            </button>
            <button className="flex items-center gap-1 bg-gray-800 text-white px-3 py-1.5 rounded text-sm hover:bg-black" onClick={() => window.print()}>
              <Printer size={14} /> Print
            </button>
            <button className="px-3 py-1.5 rounded text-sm border border-gray-300" onClick={onClose}>
              <X size={14} /> Close
            </button>
          </div>
        </div>
        <div id="print-root" className="p-8">
          {children}
        </div>
        <div id="print-footer" className="hidden print:block text-center text-[8px] text-gray-500 pb-4">
          Powered by Aura Stay
        </div>
      </div>
    </div>,
    portalNode
  )
}
