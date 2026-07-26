import NightAudit from "../../../pages/NightAudit"

export default function NightAuditPage({ userName, isAdmin, role }) {
  return (
    <NightAudit
      userName={userName}
      isAdmin={isAdmin}
      role={role}
    />
  )
}
