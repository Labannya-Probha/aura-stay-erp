import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpcMock = vi.fn()

vi.mock('../../../../lib/supabase', () => ({
  supabase: { rpc: (...args) => rpcMock(...args) },
}))

vi.mock('../../../../lib/tenant', () => ({
  getTenantId: () => 'tenant-test-id',
}))

const { allocateReservationRooms, fetchAvailability } = await import('../availability.service.js')

describe('allocateReservationRooms', () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it('calls the allocate_reservation_rooms RPC with the correct parameter shape', async () => {
    rpcMock.mockResolvedValue({ data: { ok: true }, error: null })

    await allocateReservationRooms({
      reservationId: 'res-1',
      roomIds: ['room-1', 'room-2'],
      checkIn: '2026-08-01',
      checkOut: '2026-08-05',
      rate: 5000,
    })

    expect(rpcMock).toHaveBeenCalledWith('allocate_reservation_rooms', {
      p_tenant_id: 'tenant-test-id',
      p_reservation_id: 'res-1',
      p_room_ids: ['room-1', 'room-2'],
      p_from_date: '2026-08-01',
      p_to_date: '2026-08-05',
      p_rate: 5000,
    })
  })

  it('propagates the database error instead of swallowing it', async () => {
    // This is the behavior that matters most: if the DB exclusion constraint
    // (reservation_rooms_no_overlap) rejects a double-booking, the RPC call
    // returns an error - this must surface to the caller, not be silently ignored.
    rpcMock.mockResolvedValue({
      data: null,
      error: {
        message:
          'conflicting key value violates exclusion constraint "reservation_rooms_no_overlap"',
      },
    })

    await expect(
      allocateReservationRooms({
        reservationId: 'res-1',
        roomIds: ['room-1'],
        checkIn: '2026-08-01',
        checkOut: '2026-08-05',
        rate: 5000,
      }),
    ).rejects.toMatchObject({ message: expect.stringContaining('reservation_rooms_no_overlap') })
  })

  it('defaults rate to 0 when not provided', async () => {
    rpcMock.mockResolvedValue({ data: {}, error: null })
    await allocateReservationRooms({
      reservationId: 'res-1',
      roomIds: ['room-1'],
      checkIn: '2026-08-01',
      checkOut: '2026-08-05',
    })
    expect(rpcMock).toHaveBeenCalledWith(
      'allocate_reservation_rooms',
      expect.objectContaining({ p_rate: 0 }),
    )
  })
})

describe('fetchAvailability', () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it('always returns an array, even if the RPC returns null data', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null })
    const result = await fetchAvailability({ checkIn: '2026-08-01', checkOut: '2026-08-05' })
    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual([])
  })

  it('defaults quantity to 1 when not provided', async () => {
    rpcMock.mockResolvedValue({ data: [], error: null })
    await fetchAvailability({ checkIn: '2026-08-01', checkOut: '2026-08-05' })
    expect(rpcMock).toHaveBeenCalledWith(
      'reservation_availability',
      expect.objectContaining({ p_quantity: 1 }),
    )
  })
})
