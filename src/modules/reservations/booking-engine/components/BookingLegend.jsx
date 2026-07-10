const legends = [
  ["Confirmed", "confirmed"],
  ["Tentative", "tentative"],
  ["In-house", "checked-in"],
  ["Blocked", "blocked"],
  ["Cancelled", "cancelled"],
  ["No show", "no-show"],
]

export default function BookingLegend() {
  return (
    <div className="aeds-booking-legend">
      {legends.map(([label, cls]) => (
        <span key={label}>
          <i className={cls} />
          {label}
        </span>
      ))}
    </div>
  )
}
