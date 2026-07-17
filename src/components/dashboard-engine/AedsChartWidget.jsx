import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import AedsWidgetCard from "./AedsWidgetCard"

export default function AedsChartWidget({ widget }) {
  const data = widget.data || []

  return (
    <AedsWidgetCard title={widget.title} subtitle={widget.subtitle} span={widget.span || 6}>
      <ResponsiveContainer width="100%" height={widget.height || 260}>
        {widget.chartType === "area" ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F0" />
            <XAxis dataKey={widget.xKey || "name"} axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey={widget.yKey || "value"} stroke="#0B7A45" fill="#DCFCE7" strokeWidth={3} />
          </AreaChart>
        ) : widget.chartType === "pie" ? (
          <PieChart>
            <Pie data={data} dataKey={widget.yKey || "value"} nameKey={widget.xKey || "name"} innerRadius={60} outerRadius={90} paddingAngle={3}>
              {data.map((item, index) => (
                <Cell key={item.name || index} fill={item.color || ["#007A78", "#4F46E5", "#8B5CF6", "#F59E0B"][index % 4]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F0" />
            <XAxis dataKey={widget.xKey || "name"} axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey={widget.yKey || "value"} fill="#0B7A45" radius={[10, 10, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </AedsWidgetCard>
  )
}
