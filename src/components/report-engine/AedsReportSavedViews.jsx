export default function AedsReportSavedViews({ views = [], onLoad }) {
  if (!views.length) return null

  return (
    <div className="aeds-saved-views">
      {views.map((view) => (
        <button key={view.id || view.name} type="button" onClick={() => onLoad(view)}>
          {view.name}
        </button>
      ))}
    </div>
  )
}
