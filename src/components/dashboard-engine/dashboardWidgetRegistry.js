import { BedDouble, Hotel, ReceiptText, TrendingUp, Users, Wallet } from "lucide-react"
import AedsKpiWidget from "./AedsKpiWidget"
import AedsChartWidget from "./AedsChartWidget"
import AedsTableWidget from "./AedsTableWidget"
import AedsTaskWidget from "./AedsTaskWidget"

export const WIDGET_REGISTRY = {
  kpi: AedsKpiWidget,
  chart: AedsChartWidget,
  table: AedsTableWidget,
  task: AedsTaskWidget,
}

export const EXECUTIVE_DASHBOARD_WIDGETS = [
  {
    id: "total-revenue",
    type: "kpi",
    title: "Total Revenue",
    value: "৳27,85,650",
    delta: "12.5%",
    icon: TrendingUp,
    span: 3,
  },
  {
    id: "gross-profit",
    type: "kpi",
    title: "Gross Profit",
    value: "৳9,21,118",
    delta: "18.2%",
    icon: Wallet,
    tone: "info",
    span: 3,
  },
  {
    id: "occupancy",
    type: "kpi",
    title: "Occupancy",
    value: "68.4%",
    delta: "6.2%",
    icon: BedDouble,
    tone: "warning",
    span: 3,
  },
  {
    id: "revpar",
    type: "kpi",
    title: "RevPAR",
    value: "৳4,562",
    delta: "9.1%",
    icon: Hotel,
    span: 3,
  },
  {
    id: "revenue-overview",
    type: "chart",
    title: "Revenue Overview",
    subtitle: "Monthly revenue trend",
    chartType: "bar",
    xKey: "month",
    yKey: "value",
    span: 8,
    data: [
      { month: "Jan", value: 1200000 },
      { month: "Feb", value: 1180000 },
      { month: "Mar", value: 520000 },
      { month: "Apr", value: 1400000 },
      { month: "May", value: 1050000 },
      { month: "Jun", value: 1280000 },
    ],
  },
  {
    id: "dept-revenue",
    type: "chart",
    title: "Revenue by Department",
    subtitle: "Rooms, F&B, Banquet and others",
    chartType: "pie",
    xKey: "name",
    yKey: "value",
    span: 4,
    data: [
      { name: "Rooms", value: 1245650, color: "#007A78" },
      { name: "F&B", value: 785320, color: "#4F46E5" },
      { name: "Banquet", value: 456780, color: "#8B5CF6" },
      { name: "Other", value: 297900, color: "#F59E0B" },
    ],
  },
  {
    id: "today-summary",
    type: "table",
    title: "Today’s Summary",
    subtitle: "Operational activity",
    span: 6,
    columns: [
      { key: "label", label: "Metric" },
      { key: "value", label: "Value" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { label: "Check-ins", value: 42, status: "On Track" },
      { label: "Check-outs", value: 31, status: "Pending" },
      { label: "New Bookings", value: 25, status: "Good" },
      { label: "Walk-in Guests", value: 18, status: "Good" },
    ],
  },
  {
    id: "approvals",
    type: "task",
    title: "Pending Approvals",
    subtitle: "Tasks requiring manager attention",
    span: 6,
    tasks: [
      { title: "Approve vendor payment", owner: "Accounts", due: "Today" },
      { title: "Review room discount", owner: "Front Office", due: "2h" },
      { title: "Approve purchase order", owner: "Inventory", due: "Today" },
    ],
  },
]
