import { AedsReportEngine } from "../../../components/report-engine"

export default function MetadataReportEngineDemo({ role = "ADMIN" }) {
  return (
    <AedsReportEngine
      role={role}
      initialDepartment="accounts"
      initialSlug="ledger"
    />
  )
}
