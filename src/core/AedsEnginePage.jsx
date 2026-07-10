import "./aeds-core.css"

export default function AedsEnginePage({ title, subtitle, badge, children }) {
  return (
    <section className="aeds-core-page">
      <header className="aeds-core-header">
        {badge && <span className="aeds-core-badge">{badge}</span>}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>
      {children}
    </section>
  )
}
