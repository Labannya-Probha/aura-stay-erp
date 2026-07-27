import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

type RoomRow = Record<string, any>

function inferFloorLabel(room: RoomRow) {
  if (room.floor_name) return String(room.floor_name)
  if (room.floor) return `Floor ${room.floor}`

  const roomNo = String(room.room_no || room.room_name || '')
  const digits = roomNo.match(/\d+/)?.[0]
  if (!digits) return 'Unassigned'

  const numeric = Number(digits)
  if (!Number.isFinite(numeric)) return 'Unassigned'

  const floor = Math.max(1, Math.floor(numeric / 100))
  return `Floor ${floor}`
}

function normalizeStatus(room: RoomRow) {
  return String(room.hk_status || room.status || 'VACANT').toUpperCase()
}

function normalizeRoom(room: RoomRow) {
  return {
    id: room.id,
    roomNo: String(room.room_no || room.room_name || room.id || '—'),
    roomType: String(room.room_type || 'Room'),
    roomName: String(room.room_name || room.room_no || 'Room'),
    status: normalizeStatus(room),
    isActive: room.is_active !== false,
    floorLabel: inferFloorLabel(room),
    updatedAt: room.updated_at || room.created_at || null,
    notes: room.notes || room.description || '',
  }
}

function buildStatusCounts(rooms) {
  return rooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1
    return acc
  }, {})
}

export function useRoomSnapshot({ tenantId, limit = 400 } = {}) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const loadIdRef = useRef(0)

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const loadId = ++loadIdRef.current
      silent ? setRefreshing(true) : setLoading(true)
      setError('')

      try {
        if (!supabase || !tenantId) {
          setRooms([])
          return
        }

        const { data, error: loadError } = await supabase
          .from('rooms')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('room_no', { ascending: true })
          .limit(limit)

        if (loadError) throw loadError
        if (loadId === loadIdRef.current) {
          setRooms(Array.isArray(data) ? data.map(normalizeRoom) : [])
        }
      } catch (loadError) {
        if (loadId === loadIdRef.current) {
          setError(loadError?.message || 'Room status could not be loaded.')
        }
      } finally {
        if (loadId === loadIdRef.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [limit, tenantId],
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!supabase || !tenantId) return undefined

    const channel = supabase
      .channel(`room-snapshot-${tenantId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => void load({ silent: true }),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_status_history',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => void load({ silent: true }),
      )
      .subscribe()

    const refresh = () => document.visibilityState === 'visible' && void load({ silent: true })
    const online = () => void load({ silent: true })

    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('online', online)

    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('online', online)
      void supabase.removeChannel(channel)
    }
  }, [load, tenantId])

  return {
    rooms,
    loading,
    refreshing,
    error,
    roomCount: rooms.length,
    activeRoomCount: rooms.filter((room) => room.isActive).length,
    statusCounts: useMemo(() => buildStatusCounts(rooms), [rooms]),
    refresh: () => void load({ silent: true }),
  }
}
