import ReservationStatusBadge from "../../shared/ReservationStatusBadge"
import ReservationMoney from "../../shared/ReservationMoney"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table"

export default function ReservationTable({ rows = [], loading = false, onOpen }) {
  if (loading) {
    return <div className="h-72 animate-pulse rounded-3xl border border-slate-200/80 bg-slate-100/80" />
  }

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm font-semibold text-slate-400 shadow-sm">
        No reservations found
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <Table className="w-full text-left text-sm">
        <TableHeader className="bg-slate-50/90 text-xs uppercase tracking-[0.14em] text-slate-500">
          <TableRow>
            <TableHead className="px-5 py-4 font-semibold">Guest</TableHead>
            <TableHead className="px-5 py-4 font-semibold">Stay</TableHead>
            <TableHead className="px-5 py-4 font-semibold">Room</TableHead>
            <TableHead className="px-5 py-4 font-semibold">Status</TableHead>
            <TableHead className="px-5 py-4 text-right font-semibold">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onOpen?.(row.id)}
              className="cursor-pointer transition-colors hover:bg-slate-50/80"
            >
              <TableCell className="px-5 py-4 font-semibold text-slate-900">{row.guestName || row.guest_name || "Guest"}</TableCell>
              <TableCell className="px-5 py-4 text-slate-600">{row.checkIn || row.check_in} → {row.checkOut || row.check_out}</TableCell>
              <TableCell className="px-5 py-4 text-slate-600">{row.roomNumber || row.room_number || "-"}</TableCell>
              <TableCell className="px-5 py-4"><ReservationStatusBadge status={row.status} /></TableCell>
              <TableCell className="px-5 py-4 text-right font-semibold"><ReservationMoney value={row.balance || row.balance_due} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
