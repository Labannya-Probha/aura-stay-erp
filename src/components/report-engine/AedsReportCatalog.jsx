export default function AedsReportCatalog({ groups = [], active, onSelect }) {
  return (
    <aside className="aeds-report-catalog">
      <header className="aeds-report-catalog-header">
        <h2>Reports</h2>
      </header>

      <div className="aeds-report-catalog-body">
        {groups.map((group) => (
          <section key={group.department.slug} className="aeds-report-catalog-group">
            <h3>{group.department.name}</h3>

            {(group.reports || []).map((report) => {
              const key = `${group.department.slug}/${report.slug}`
              const selected = active === key

              return (
                <button
                  key={report.reportCode || key}
                  type="button"
                  className={`aeds-report-catalog-item ${selected ? "active" : ""}`}
                  onClick={() => onSelect(group.department.slug, report.slug)}
                >
                  <span>{report.title}</span>
                  <small>{report.description || report.route}</small>
                </button>
              )
            })}
          </section>
        ))}
      </div>
    </aside>
  )
}
