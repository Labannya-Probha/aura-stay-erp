export default function AedsEngineCard({ title, description, span = 4, children }) {
  return (
    <article className={`aeds-core-card span-${span}`}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </article>
  )
}
