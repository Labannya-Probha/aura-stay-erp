export default function AedsBreadcrumb({ items = [], go }) {
  return (
    <nav className="aeds-breadcrumb">
      <span>Modules</span>
      {items.map((item) => (
        <span key={item.path || item.label} className={item.current ? "current" : ""}>
          /
          <button type="button" onClick={() => item.path && go(item.path)}>
            {item.label}
          </button>
        </span>
      ))}
    </nav>
  )
}
