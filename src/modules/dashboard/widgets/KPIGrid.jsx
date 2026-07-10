import {
  BedDouble,
  CreditCard,
  Hotel,
  ReceiptText,
  TrendingUp,
  Utensils,
} from "lucide-react"
import KPIWidget from "./KPIWidget"

function money(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`
}

export default function KPIGrid({ loading = false, data = {} }) {
  const items = [
    {
      title: "Occupancy",
      value: `${data.occupancy ?? 0}%`,
      subtitle: "Current occupancy",
      icon: Hotel,
      trendValue: "Live",
      trendDelta: "+8.6%",
    },
    {
      title: "ADR",
      value: money(data.adr),
      subtitle: "Average daily rate",
      icon: TrendingUp,
      trendValue: "Live",
      trendDelta: "+6.4%",
    },
    {
      title: "RevPAR",
      value: money(data.revpar),
      subtitle: "Revenue per available room",
      icon: BedDouble,
      trendValue: "Live",
      trendDelta: "+9.7%",
    },
    {
      title: "Room Revenue",
      value: money(data.roomRevenue),
      subtitle: "Today's room revenue",
      icon: ReceiptText,
      trendValue: "Today",
      trendDelta: "+12.1%",
    },
    {
      title: "Restaurant Revenue",
      value: money(data.restaurantRevenue),
      subtitle: "Today's restaurant sales",
      icon: Utensils,
      trendValue: "Today",
      trendDelta: "+7.3%",
    },
    {
      title: "Cash Collection",
      value: money(data.cashCollection),
      subtitle: "Collected today",
      icon: CreditCard,
      trendValue: "Today",
      trendDelta: "+10.8%",
    },
  ]

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <KPIWidget
          key={item.title}
          loading={loading}
          title={item.title}
          value={item.value}
          subtitle={item.subtitle}
          icon={item.icon}
          trendValue={item.trendValue}
          trendDelta={item.trendDelta}
        />
      ))}
    </div>
  )
}
