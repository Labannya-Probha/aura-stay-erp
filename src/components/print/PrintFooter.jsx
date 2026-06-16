// src/components/print/PrintFooter.jsx
// Shared footer for every print document. Neutral styling so it sits cleanly
// on both branded (GuestBill) and black-and-white statutory forms.
export default function PrintFooter({ company, note }) {
  const software = company?.software_name || 'Aura Stay'
  return (
    <div style={{
      marginTop: 16, paddingTop: 7, borderTop: '1px solid #cbd5d1',
      textAlign: 'center', fontSize: 9, color: '#6b7280', letterSpacing: '0.04em',
    }}>
      {note && <div style={{ marginBottom: 2 }}>{note}</div>}
      Powered by <span style={{ fontWeight: 700, color: '#374151' }}>{software}</span>
    </div>
  )
}
