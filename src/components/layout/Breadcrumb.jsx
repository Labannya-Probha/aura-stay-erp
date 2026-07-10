export default function Breadcrumb({ items = [] }) {
  if (!items.length) return null

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-500">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <span>/</span>}
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  )
}