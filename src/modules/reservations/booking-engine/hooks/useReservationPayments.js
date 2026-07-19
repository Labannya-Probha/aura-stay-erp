export function useReservationPayments() {
  return {
    summary: {
      total: 0,
      paid: 0,
      due: 0,
    },
    rows: [],
    loading: false,
    error: "",
  }
}