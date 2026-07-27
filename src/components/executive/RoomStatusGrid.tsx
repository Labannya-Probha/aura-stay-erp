import { AlertTriangle, BedDouble, CheckCircle2, DoorOpen, Wrench } from 'lucide-react'
import { EmptyState } from 'src/components/feedback/EmptyState'
import { LoadingState } from 'src/components/feedback/LoadingState'
import { cn } from 'src/lib/utils'

type RoomCell = {
  id: string
  roomNo: string
  roomType?: string
  roomName?: string
  status: string
  floorLabel: string
  notes?: string
}

type RoomStatusGridProps = {
  rooms: RoomCell[]
  loading?: boolean
  className?: string
}

const STATUS_TONE: Record<string, { className: string; label: string; icon: typeof BedDouble }> = {
  VACANT: {
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    label: 'Vacant',
    icon: DoorOpen,
  },
  AVAILABLE: {
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    label: 'Available',
    icon: CheckCircle2,
  },
  OCCUPIED: {
    className: 'border-blue-200 bg-blue-50 text-blue-800',
    label: 'Occupied',
    icon: BedDouble,
  },
  IN_HOUSE: {
    className: 'border-blue-200 bg-blue-50 text-blue-800',
    label: 'In House',
    icon: BedDouble,
  },
  DIRTY: {
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    label: 'Dirty',
    icon: AlertTriangle,
  },
  INSPECTED: {
    className: 'border-teal-200 bg-teal-50 text-teal-800',
    label: 'Inspected',
    icon: CheckCircle2,
  },
  RESERVED: {
    className: 'border-sky-200 bg-sky-50 text-sky-800',
    label: 'Reserved',
    icon: BedDouble,
  },
  OUT_OF_ORDER: {
    className: 'border-rose-200 bg-rose-50 text-rose-800',
    label: 'Out of Order',
    icon: Wrench,
  },
  OOO: {
    className: 'border-rose-200 bg-rose-50 text-rose-800',
    label: 'Out of Order',
    icon: Wrench,
  },
}

const STATUS_DOT: Record<string, string> = {
  VACANT: 'bg-emerald-500',
  AVAILABLE: 'bg-emerald-500',
  OCCUPIED: 'bg-blue-500',
  IN_HOUSE: 'bg-blue-500',
  DIRTY: 'bg-amber-500',
  INSPECTED: 'bg-teal-500',
  RESERVED: 'bg-sky-500',
  OUT_OF_ORDER: 'bg-rose-500',
  OOO: 'bg-rose-500',
}
function groupRooms(rooms: RoomCell[]) {
  return rooms.reduce<Record<string, RoomCell[]>>((acc, room) => {
    const key = room.floorLabel || 'Unassigned'
    acc[key] = acc[key] || []
    acc[key].push(room)
    return acc
  }, {})
}

export default function RoomStatusGrid({ rooms, loading = false, className }: RoomStatusGridProps) {
  if (loading) {
    return (
      <LoadingState
        variant="container"
        label="Loading room grid"
        description="Fetching live floor status."
        className={className}
      />
    )
  }

  if (!rooms || rooms.length === 0) {
    return (
      <EmptyState
        variant="container"
        title="No live room snapshot available"
        description="The floor grid appears when the room feed is reachable."
        className={className}
      />
    )
  }

  const grouped = groupRooms(rooms)
  const floors = Object.entries(grouped).sort(([left], [right]) =>
    left.localeCompare(right, undefined, { numeric: true }),
  )

  return (
    <section
      className={cn('rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Live Room Map
          </p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
            Color-coded floor status grid
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
          {Object.values(STATUS_TONE)
            .slice(0, 5)
            .map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1"
              >
                <i
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    STATUS_DOT[item.label.toUpperCase().replace(/\s+/g, '_')] || 'bg-slate-400',
                  )}
                />
                {item.label}
              </span>
            ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {floors.map(([floorLabel, floorRooms]) => (
          <article
            key={floorLabel}
            className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
          >
            <header className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  {floorLabel}
                </p>
                <h3 className="text-base font-black text-slate-950">{floorRooms.length} rooms</h3>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-500 shadow-sm">
                Live
              </span>
            </header>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {floorRooms.map((room) => {
                const status = STATUS_TONE[room.status] || STATUS_TONE.VACANT
                const Icon = status.icon

                return (
                  <div
                    key={room.id}
                    className={cn(
                      'rounded-2xl border p-3 shadow-sm transition hover:-translate-y-0.5',
                      status.className,
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-lg font-black leading-none tracking-tight">
                          {room.roomNo}
                        </div>
                        <div className="mt-1 text-[11px] font-bold uppercase tracking-wide opacity-80">
                          {room.roomType || 'Room'}
                        </div>
                      </div>

                      <Icon size={16} aria-hidden="true" />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-black uppercase tracking-wide">
                      <span>{status.label}</span>
                      <span className="opacity-70">{room.roomName || 'Assigned'}</span>
                    </div>

                    {room.notes ? (
                      <p className="mt-2 line-clamp-2 text-[11px] font-semibold opacity-80">
                        {room.notes}
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
