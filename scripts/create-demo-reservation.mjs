import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function main() {
  const today = new Date()
  const checkIn = toDateString(today)
  const checkOut = toDateString(today)

  const { data: propertyRows, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .limit(1)

  if (propertyError) throw propertyError
  const tenantId = propertyRows?.[0]?.id
  if (!tenantId) throw new Error('No tenant found in properties table')

  const { data: guestData, error: guestError } = await supabase
    .from('guests')
    .insert({
      tenant_id: tenantId,
      full_name: 'Demo Guest',
      phone: '01700000000',
      email: 'demo@example.com',
      customer_id: 'DEMO-001',
      status: 'ACTIVE',
    })
    .select('*')
    .single()

  if (guestError) throw guestError

  const { data: roomRows, error: roomError } = await supabase
    .from('rooms')
    .select('id')
    .eq('is_active', true)
    .order('room_no')
    .limit(1)

  if (roomError) throw roomError
  const roomId = roomRows?.[0]?.id
  if (!roomId) throw new Error('No active room found')

  const resNo = `DEMO-${Date.now().toString().slice(-6)}`

  const { data: reservationData, error: reservationError } = await supabase
    .from('reservations')
    .insert({
      tenant_id: tenantId,
      res_no: resNo,
      reservation_name: 'Demo Guest Stay',
      primary_guest_id: guestData.id,
      status: 'CHECKED_IN',
      check_in: checkIn,
      check_out: checkOut,
      source: 'DIRECT',
      pax_adults: 1,
      pax_children: 0,
      notes: 'Demo reservation for checkout flow',
    })
    .select('*')
    .single()

  if (reservationError) throw reservationError

  const { data: assignmentData, error: assignmentError } = await supabase
    .from('reservation_rooms')
    .insert({
      tenant_id: tenantId,
      reservation_id: reservationData.id,
      room_id: roomId,
      from_date: checkIn,
      to_date: checkOut,
      rate: 3000,
    })
    .select('*')
    .single()

  if (assignmentError) throw assignmentError

  const { data: chargeData, error: chargeError } = await supabase
    .from('folio_charges')
    .insert({
      tenant_id: tenantId,
      reservation_id: reservationData.id,
      charge_date: checkIn,
      description: 'Room charge',
      total: 5000,
      charge_type: 'ROOM',
    })
    .select('*')
    .single()

  if (chargeError) {
    console.warn('Charge insert failed:', chargeError.message)
  } else {
    console.log('charge inserted', chargeData.id)
  }

  const { data: paymentData, error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id: tenantId,
      reservation_id: reservationData.id,
      received_date: checkIn,
      amount: 3000,
      method: 'CASH',
      received_by: 'Demo',
      payment_class: 'DEPOSIT',
      notes: 'Demo payment',
    })
    .select('*')
    .single()

  if (paymentError) {
    console.warn('Payment insert failed:', paymentError.message)
  } else {
    console.log('payment inserted', paymentData.id)
  }

  console.log(JSON.stringify({
    tenantId,
    guestId: guestData.id,
    reservationId: reservationData.id,
    reservationNo: reservationData.res_no,
    roomAssignmentId: assignmentData.id,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
