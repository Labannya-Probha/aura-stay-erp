import { useEffect } from 'react'
import { X, Printer } from 'lucide-react'

export default function PrintPortal({ title, onClose, children, type = 'A4' }) {
  // Inject @page into <head> and clean up on unmount
  useEffect(() => {
    const style = document.createElement('style')
    style.id = '__print-portal-page-style__'
    // A4-এর ক্ষেত্রে bottom margin 15mm রাখা হয়েছে যেন ফুটারের জন্য পর্যাপ্ত জায়গা থাকে
    style.innerHTML = `
      @page {
        size: ${type === 'thermal' ? '80mm auto' : 'A4'};
        margin: ${type === 'thermal' ? '0' : '10mm 10mm 15mm 10mm'};
      }
    `
    document.head.appendChild(style)
    return () => {
      const el = document.getElementById('__print-portal-page-style__')
      if (el) el.remove()
    }
  }, [type])

  return (
    <>
      <style>{`
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body * { visibility: hidden !important; }

          /* শুধুমাত্র আমাদের প্রিন্ট ওভারলে এবং তার ভেতরের জিনিস দৃশ্যমান থাকবে */
          #print-modal-overlay, #print-modal-overlay * { visibility: visible !important; }

          /* মাল্টি-পেজ A4 প্রিন্টের জন্য ওভারলে-কে ন্যাচারাল ফ্লো-তে আনা হলো */
          #print-modal-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: transparent !important;
            display: block !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          /* ডিফল্ট উইন্ডো শ্যাডো ও প্যাডিং রিমুভ করা হলো */
          #print-modal-overlay > div {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 0 !important;
          }

          .no-print { display: none !important; }

          /* ফ্লেক্সবক্সের বদলে ব্লক লেআউট, যেন A4 পেজে ঠিকমতো পেজ ব্রেক হয় */
          #print-root {
            display: block !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            font-size: ${type === 'thermal' ? '10px' : '11px'};
            color: #000 !important;
          }

          /* টেবিল যেন পেজের মাঝখানে না ভেঙে যায় */
          table { width: 100% !important; border-collapse: collapse; }
          tr, td, th, img, svg { page-break-inside: avoid; break-inside: avoid; }

          /* ফুটার লজিক: A4-এর জন্য ফিক্সড (প্রতি পেজের নিচে), থার্মালের জন্য শেষে (relative) */
          #print-footer {
            display: block !important;
            position: ${type === 'thermal' ? 'relative' : 'fixed'} !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100% !important;
            text-align: center !important;
            font-size: 9px !important;
            color: #666 !important;
            border-top: 1px solid #ccc !important;
            padding-top: 5px !important;
            margin-top: ${type === 'thermal' ? '15px' : '0'} !important;
            background: #fff !important;
            z-index: 9999 !important;
          }
        }
      `}</style>

      {/* Wrapper ID যোগ করা হয়েছে CSS টার্গেট করার জন্য */}
      <div id="print-modal-overlay" className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-auto p-6">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-4 relative">

          {/* Toolbar — hidden during print */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-leaf sticky top-0 bg-white rounded-t-xl z-10 no-print">
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

          {/* Print Content Wrapper */}
          <div
            id="print-root"
            className={`p-6 ${type === 'thermal' ? 'epos-receipt' : 'print-doc'}`}
          >
            {children}
          </div>

          {/* Dedicated Print Footer - স্ক্রিনে লুকানো থাকবে, শুধু প্রিন্টে দেখাবে */}
          <div id="print-footer" className="hidden">
            Powered by Aura Stay
          </div>

        </div>
      </div>
    </>
  )
}
