const LEGEND = {
  QUERY: {
    label: "Query",
    color: "#7C3AED",
  },
  QUOTED: {
    label: "Quoted",
    color: "#CA8A04",
  },
  TENTATIVE: {
    label: "Tentative",
    color: "#F59E0B",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "#2563EB",
  },
  CHECKED_IN: {
    label: "In-house",
    color: "#15803D",
  },
  CHECKED_OUT: {
    label: "Checked out",
    color: "#D97706",
  },
  SETTLED: {
    label: "Settled",
    color: "#0F766E",
  },
  NO_SHOW: {
    label: "No show",
    color: "#DC2626",
  },
  BLOCKED: {
    label: "Blocked",
    color: "#334155",
  },
}

export default function BookingLegend({
  reservations = [],
}) {
  const counts = reservations.reduce(
    (summary, reservation) => {
      const status = String(
        reservation.status || ""
      ).toUpperCase()

      if (LEGEND[status]) {
        summary[status] =
          Number(summary[status] || 0) + 1
      }

      return summary
    },
    {}
  )

  const visibleStatuses = Object.keys(counts)

  return (
    <div className="aeds-booking-legend">
      <strong>Calendar indicators</strong>

      <span>
        <i style={{ backgroundColor: "rgba(46,125,50,0.35)" }} />
        Weekend (Fri/Sat)
      </span>
      <span>
        <i style={{ backgroundColor: "rgba(212,160,23,0.55)" }} />
        Govt. Holiday
      </span>

      {visibleStatuses.map((status) => (
        <span key={status}>
          <i
            style={{
              backgroundColor:
                LEGEND[status].color,
            }}
          />
          {LEGEND[status].label}
          <b>{counts[status]}</b>
        </span>
      ))}
    </div>
  )
}
