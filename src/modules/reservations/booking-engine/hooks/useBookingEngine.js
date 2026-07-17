import {
  useCallback,
  useEffect,
  useState,
} from "react"

import {
  getBookingCalendarData,
  moveReservationAssignment,
} from "../services/bookingCalendarService"

const EMPTY_DATA = {
  rooms: [],
  reservations: [],
  conflicts: [],
  kpis: {},
}

export function useBookingEngine({ days, filters }) {
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [moving, setMoving] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) setRefreshing(true)
        else setLoading(true)

        setError("")

        const result =
          await getBookingCalendarData({
            startDate: days[0]?.iso,
            endDate: days.at(-1)?.iso,
            filters,
          })

        setData({
          ...EMPTY_DATA,
          ...result,
        })
      } catch (loadError) {
        console.error(
          "Booking calendar load failed:",
          loadError
        )

        setError(
          loadError?.message ||
            "Booking calendar could not be loaded."
        )

        setData(EMPTY_DATA)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [days, filters]
  )

  useEffect(() => {
    load()
  }, [load])

  const moveBooking = useCallback(
    async ({
      reservation,
      targetRoomId,
      targetStartDate,
    }) => {
      setMoving(true)
      setError("")

      try {
        const currentStart =
          new Date(`${reservation.checkIn}T00:00:00`)

        const currentEnd =
          new Date(`${reservation.checkOut}T00:00:00`)

        const durationDays = Math.max(
          1,
          Math.round(
            (currentEnd.getTime() -
              currentStart.getTime()) /
              86_400_000
          )
        )

        const nextStart =
          new Date(`${targetStartDate}T00:00:00`)

        const nextEnd = new Date(nextStart)
        nextEnd.setDate(
          nextEnd.getDate() + durationDays
        )

        await moveReservationAssignment({
          assignmentId: reservation.assignmentId,
          reservationId:
            reservation.reservationId,
          roomId: targetRoomId,
          fromDate: targetStartDate,
          toDate: nextEnd
            .toISOString()
            .slice(0, 10),
        })

        await load({ silent: true })
      } catch (moveError) {
        setError(
          moveError?.message ||
            "Reservation could not be moved."
        )

        throw moveError
      } finally {
        setMoving(false)
      }
    },
    [load]
  )

  return {
    loading,
    refreshing,
    moving,
    error,
    rooms: data.rooms,
    reservations: data.reservations,
    conflicts: data.conflicts,
    kpis: data.kpis,
    refresh: () => load({ silent: true }),
    moveBooking,
  }
}
