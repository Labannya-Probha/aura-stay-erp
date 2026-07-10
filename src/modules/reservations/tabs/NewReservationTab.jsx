import { useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { NewReservation } from "../../../pages/Reservations.jsx"

export default function NewReservationTab({ openReservation, userName, onBackToList }) {
  const location = useLocation()
  const navigate = useNavigate()
  const prefill = location.state?.prefill || null

  const clearPrefill = useCallback(() => {
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
  }, [location.pathname, location.search, navigate])

  const handleClose = useCallback(() => {
    clearPrefill()
    onBackToList?.()
  }, [clearPrefill, onBackToList])

  return (
    <NewReservation
      close={handleClose}
      openReservation={openReservation}
      userName={userName}
      prefill={prefill}
    />
  )
}
