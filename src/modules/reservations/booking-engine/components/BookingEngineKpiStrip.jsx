const KPI_ITEMS = [
  { key: "availableRooms", label: "Available" },
  { key: "occupiedRooms", label: "Occupied" },
  { key: "arrivals", label: "Arrivals" },
  { key: "departures", label: "Departures" },
  { key: "outOfOrder", label: "OOO" },
  { key: "occupancy", label: "OCC %", suffix: "%" },
]

export default function BookingEngineKpiStrip({ data = {}, loading = false }) {
  return (
    <div className="aeds-booking-kpis">
      {KPI_ITEMS.map((item) => (
        <div key={item.key} className="aeds-booking-kpi">
          <span>{item.label}</span>
          <strong>
            {loading ? "..." : `${data[item.key] ?? 0}${item.suffix || ""}`}
          </strong>
        </div>
      ))}
    </div>
  )
}
