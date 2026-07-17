import AedsWidgetCard from "./AedsWidgetCard"

export default function AedsTaskWidget({ widget }) {
  const tasks = widget.tasks || []

  return (
    <AedsWidgetCard title={widget.title} subtitle={widget.subtitle} span={widget.span || 4}>
      <div className="aeds-task-list">
        {tasks.map((task, index) => (
          <div key={task.id || index} className="aeds-task-item">
            <span>{index + 1}</span>
            <div>
              <strong>{task.title}</strong>
              <small>{task.owner || "Unassigned"}</small>
            </div>
            <em>{task.due || "Today"}</em>
          </div>
        ))}
      </div>
    </AedsWidgetCard>
  )
}
