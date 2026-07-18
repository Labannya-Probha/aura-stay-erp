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
    return <div className="h-72 animate-pulse rounded-3xl bg-slate-100" />
  }

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-400">
        No reservations found
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <Table className="w-full text-left text-sm">
        <TableHeader className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
          <TableRow>
            <TableHead className="px-5 py-4">Guest</TableHead>
            <TableHead className="px-5 py-4">Stay</TableHead>
            <TableHead className="px-5 py-4">Room</TableHead>
            <TableHead className="px-5 py-4">Status</TableHead>
            <TableHead className="px-5 py-4 text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onOpen?.(row.id)}
              className="cursor-pointer hover:bg-slate-50"
            >
              <TableCell className="px-5 py-4 font-bold text-slate-900">{row.guestName || row.guest_name || "Guest"}</TableCell>
              <TableCell className="px-5 py-4 text-slate-600">{row.checkIn || row.check_in} → {row.checkOut || row.check_out}</TableCell>
              <TableCell className="px-5 py-4 text-slate-600">{row.roomNumber || row.room_number || "-"}</TableCell>
              <TableCell className="px-5 py-4"><ReservationStatusBadge status={row.status} /></TableCell>
              <TableCell className="px-5 py-4 text-right"><ReservationMoney value={row.balance || row.balance_due} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
