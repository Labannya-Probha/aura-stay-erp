import { BedDouble, CalendarDays, CreditCard, Hotel, ReceiptText, TrendingUp, Users, Wallet } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import AedsV5Shell from "../../app/layouts/AedsV5Shell"
import AedsMetricCard from "../../components/aeds/AedsMetricCard"
import AedsChartCard from "../../components/aeds/AedsChartCard"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { formatBDT } from "../../lib/utils"
import "./aeds-v5-dashboard.css"

const monthlyRevenue=[{month:"Jan",current:1200000,last:1850000},{month:"Feb",current:1180000,last:1900000},{month:"Mar",current:520000,last:1340000},{month:"Apr",current:1400000,last:1880000},{month:"May",current:1050000,last:2360000},{month:"Jun",current:1280000,last:1900000},{month:"Jul",current:940000,last:1600000},{month:"Aug",current:720000,last:1380000},{month:"Sep",current:650000,last:1660000},{month:"Oct",current:1360000,last:2320000},{month:"Nov",current:900000,last:2650000},{month:"Dec",current:1280000,last:2100000}]
const occupancy=[{day:"01 May",value:58},{day:"08 May",value:67},{day:"15 May",value:89},{day:"22 May",value:76},{day:"31 May",value:74}]
const revenueDept=[{name:"Rooms",value:1245650,color:"#007A78"},{name:"F&B",value:785320,color:"#4F46E5"},{name:"Banquet",value:456780,color:"#8B5CF6"},{name:"Other",value:297900,color:"#F59E0B"}]
const transactions=[["Booking #BK-12548","Room Booking","+৳25,800","success"],["Invoice #INV-12547","F&B Invoice","+৳8,450","success"],["Payment #PAY-12546","Credit Card","+৳12,500","success"],["Expense #EXP-12545","Maintenance","-৳3,250","danger"],["Booking #BK-12544","Room Booking","+৳18,900","success"]]
const roomTypes=[["Deluxe Room",985450,35.4],["Executive Suite",752300,27],["Family Room",563200,20.2],["Premium Suite",484700,17.4]]

export default function AedsV5Dashboard({ userName }) {
  return (
    <AedsV5Shell userName={userName} active="Dashboard">
      <div className="aeds-v5-dashboard">
        <div className="aeds-v5-page-head"><div><h1>Dashboard</h1><p>Welcome back, {userName || "Ankur"}! Here’s what’s happening today.</p></div><Badge>01 May 2025 - 31 May 2025</Badge></div>
        <div className="aeds-v5-kpi-grid">
          <AedsMetricCard title="Total Revenue" value={formatBDT(2785650)} delta="12.5%" icon={TrendingUp} tone="success" />
          <AedsMetricCard title="Total Expenses" value={formatBDT(1864532)} delta="-5.3%" icon={ReceiptText} tone="danger" />
          <AedsMetricCard title="Gross Profit" value={formatBDT(921118)} delta="18.2%" icon={Wallet} tone="info" />
          <AedsMetricCard title="Occupancy (Avg.)" value="68.4%" delta="6.2%" icon={BedDouble} tone="warning" />
          <AedsMetricCard title="RevPAR" value={formatBDT(4562)} delta="9.1%" icon={Hotel} tone="success" />
        </div>
        <div className="aeds-v5-main-grid">
          <AedsChartCard title="Revenue Overview" className="aeds-v5-span-2"><ResponsiveContainer width="100%" height={260}><BarChart data={monthlyRevenue}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F0"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="current" fill="#0B7A45" radius={[10,10,0,0]}/><Bar dataKey="last" fill="#DCEBE0" radius={[10,10,0,0]}/></BarChart></ResponsiveContainer></AedsChartCard>
          <AedsChartCard title="Revenue by Department"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={revenueDept} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={3}>{revenueDept.map((item)=><Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></AedsChartCard>
          <Card><CardHeader><CardTitle>Today’s Summary</CardTitle></CardHeader><CardContent className="aeds-v5-summary">{[["Check-ins",42,Users],["Check-outs",31,CalendarDays],["New Bookings",25,ReceiptText],["Walk-in Guests",18,Users]].map(([label,value,Icon])=><div key={label}><span><Icon size={16}/></span><strong>{label}</strong><em>{value}</em></div>)}</CardContent></Card>
          <AedsChartCard title="Occupancy Trend" className="aeds-v5-span-2"><ResponsiveContainer width="100%" height={240}><AreaChart data={occupancy}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F0"/><XAxis dataKey="day" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="value" stroke="#0B7A45" fill="#DCFCE7" strokeWidth={3}/></AreaChart></ResponsiveContainer></AedsChartCard>
          <Card><CardHeader><CardTitle>Top Room Types</CardTitle></CardHeader><CardContent className="aeds-room-types">{roomTypes.map(([name,amount,percent])=><div key={name}><div><strong>{name}</strong><span>{formatBDT(amount)} · {percent}%</span></div><progress max="100" value={percent}/></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader><CardContent className="aeds-transactions">{transactions.map(([title,sub,amount,tone])=><div key={title}><span className={tone}><CreditCard size={15}/></span><div><strong>{title}</strong><small>{sub}</small></div><em className={tone}>{amount}</em></div>)}</CardContent></Card>
        </div>
      </div>
    </AedsV5Shell>
  )
}
