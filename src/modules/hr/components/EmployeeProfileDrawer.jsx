// Placeholder — full employee profile drawer (service book, nominee, etc.) planned for next phase
export default function EmployeeProfileDrawer({ employee, onClose }) {
  if (!employee) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-lg space-y-3" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display font-bold text-pine text-lg">{employee.full_name}</h2>
        <p className="text-pine/60 text-sm">{employee.designation} · {employee.department}</p>
        <button className="btn-ghost w-full justify-center" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
