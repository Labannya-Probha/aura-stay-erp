export function useReservationsList() {
  return {
    summary: {
      total: 0,
    },
    rows: [],
    loading: false,
    error: "",
  }
}