/**
 * Commit 2 service boundary.
 * No demo terminal or demo COA records are returned here.
 * Commit 3 will replace these methods with tenant-scoped Supabase queries.
 */
const paymentConfigurationService = {
  async listTerminals() { return [] },
  async createTerminal() { throw new Error('Payment terminal creation is not connected yet.') },
  async updateTerminal() { throw new Error('Payment terminal update is not connected yet.') },
  async removeTerminal() { throw new Error('Payment terminal deletion is not connected yet.') },
  async listSettlementAccounts() { return [] },
}

export default paymentConfigurationService
