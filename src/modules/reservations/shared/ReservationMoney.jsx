export default function ReservationMoney({ value = 0 }) {
  return (
    <span className="font-black tabular-nums text-slate-900">
      ৳{Number(value || 0).toLocaleString("en-BD")}
    </span>
  )
}
